import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { KeycloakAdmin } from "../auth/keycloak-admin";
import { authConfig } from "../auth/auth.config";
import { canonical, delegate, grants, has } from "../auth/access";
import { CreateUserDto, UpdateUserDto } from "./management.dto";
const select = {
  id: true,
  name: true,
  email: true,
  phone: true,
  roleId: true,
  roleNames: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { name: true } },
} as const;
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}
  private admin() {
    return new KeycloakAdmin(this.config);
  }
  async findAll() {
    return this.prisma.user.findMany({
      select,
      orderBy: { createdAt: "desc" },
    });
  }
  async findOne(id: string) {
    const u = await this.prisma.user.findUnique({ where: { id }, select });
    if (!u) throw new NotFoundException("User not found");
    return u;
  }
  async getPermissions() {
    return this.prisma.permission.findMany({
      where: { code: { not: "*" } },
      orderBy: [{ module: "asc" }, { code: "asc" }],
    });
  }
  async assignable(actor: any) {
    const rows = await this.prisma.role.findMany({
      include: { rolePermissions: { include: { permission: true } } },
    });
    return rows.filter((r) =>
      r.rolePermissions.every(
        (p) => p.permission.code !== "*" && has(actor, p.permission.code),
      ),
    );
  }
  private async selected(names: string[], actor: any) {
    const access = await grants(this.prisma, names);
    if (
      !names.length ||
      names.some((n) => !access.roles.includes(canonical(n)))
    )
      throw new BadRequestException("Select configured CCTBM roles.");
    delegate(actor, access.permissions);
    return access;
  }
  async create(dto: CreateUserDto, actor: any) {
    const access = await this.selected(dto.roleNames, actor);
    const email = dto.email.trim().toLowerCase();
    if (
      await this.prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      })
    )
      throw new ConflictException(
        "Email already exists. Link existing identities explicitly.",
      );
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: access.roles[0] },
    });
    const admin = this.admin();
    let sub: string | undefined, localId: string | undefined;
    try {
      if (authConfig().mode === "keycloak") {
        const [firstName, ...rest] = dto.name.trim().split(/\s+/);
        sub = await admin.createIdentity({
          email,
          firstName,
          lastName: rest.join(" "),
          password: dto.password,
        });
        await admin.replaceRoles(sub, access.roles);
      }
      const u = await this.prisma.user.create({
        data: {
          email,
          name: dto.name,
          phone: dto.phone,
          roleId: role.id,
          roleNames: access.roles,
          isActive: dto.isActive ?? true,
          passwordHash: await bcrypt.hash(
            sub ? randomBytes(32).toString("hex") : dto.password,
            12,
          ),
          ...(sub
            ? { keycloakSub: sub, keycloakIssuer: authConfig().issuer }
            : {}),
        },
        select,
      });
      localId = u.id;
      if (sub)
        await admin.request("/users/" + encodeURIComponent(sub), "PUT", {
          enabled: true,
          emailVerified: true,
        });
      return u;
    } catch (e) {
      if (localId)
        await this.prisma.user
          .delete({ where: { id: localId } })
          .catch(() => {});
      if (sub)
        await admin
          .request("/users/" + encodeURIComponent(sub), "DELETE")
          .catch(() => {});
      throw e;
    }
  }
  async update(id: string, dto: UpdateUserDto, actor: any) {
    const old = await this.findOne(id);
    const oldNames = old.roleNames.length ? old.roleNames : [old.role.name];
    delegate(actor, (await grants(this.prisma, oldNames)).permissions);
    if (dto.isActive === false && id === actor.sub)
      throw new ForbiddenException("You cannot deactivate yourself.");
    const access =
      dto.roleNames === undefined
        ? null
        : await this.selected(dto.roleNames, actor);
    if (
      oldNames.includes("admin") &&
      ((access && !access.roles.includes("admin")) || dto.isActive === false) &&
      (await this.prisma.user.count({
        where: { isActive: true, roleNames: { has: "admin" }, id: { not: id } },
      })) === 0
    )
      throw new ForbiddenException("Keep at least one active administrator.");
    if (dto.email && dto.email.toLowerCase() !== old.email)
      throw new BadRequestException("Manage email changes in Chiro Auth.");
    const identity = await this.prisma.user.findUniqueOrThrow({
      where: { id },
    });
    const admin = this.admin();
    if (authConfig().mode === "keycloak" && (access || dto.name)) {
      if (!identity.keycloakSub)
        throw new ConflictException(
          "Link this existing account to Chiro Auth first.",
        );
      if (access) {
        await this.prisma.user.update({
          where: { id },
          data: { rolesValidAfter: BigInt(Math.floor(Date.now() / 1000) + 1) },
        });
        await admin.replaceRoles(identity.keycloakSub, access.roles);
      }
      if (dto.name) {
        const [firstName, ...rest] = dto.name.trim().split(/\s+/);
        await admin.request(
          "/users/" + encodeURIComponent(identity.keycloakSub),
          "PUT",
          { firstName, lastName: rest.join(" ") },
        );
      }
    }
    const role = access
      ? await this.prisma.role.findUniqueOrThrow({
          where: { name: access.roles[0] },
        })
      : null;
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(access && role
          ? {
              roleId: role.id,
              roleNames: access.roles,
              rolesValidAfter: BigInt(Math.floor(Date.now() / 1000) + 1),
            }
          : {}),
      },
      select,
    });
  }
  async remove(id: string, actor: any) {
    await this.update(id, { isActive: false }, actor);
    return { message: "Account deactivated; business records retained." };
  }
}
