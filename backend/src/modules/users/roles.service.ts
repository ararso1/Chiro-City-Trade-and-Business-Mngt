import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { KeycloakAdmin } from "../auth/keycloak-admin";
import { authConfig } from "../auth/auth.config";
import { canonical, delegate, grants } from "../auth/access";
type AuthUser = any;
import { CreateRoleDto } from "./management.dto";
import { UpdateRoleDto } from "./management.dto";
export const administratorPermissions = [
  "users.read",
  "users.create",
  "users.update",
  "roles.read",
  "roles.create",
  "roles.update",
  "permissions.read",
];
const describeRole = <T extends { name: string }>(role: T) => ({
  ...role,
  isSystem: ["admin", "officer", "finance", "trader"].includes(role.name),
  protectedPermissionNames:
    role.name === "admin" ? administratorPermissions : [],
});
const include = {
  rolePermissions: { include: { permission: true } },
  users: { select: { id: true } },
} as const;
@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}
  async findAll() {
    const roles = await this.prisma.role.findMany({
      include,
      orderBy: { name: "asc" },
    });
    return roles.map(describeRole);
  }
  findOne(id: string) {
    return this.prisma.role.findUniqueOrThrow({ where: { id }, include });
  }
  async sync() {
    const remote = await new KeycloakAdmin(this.config).roles();
    for (const r of remote) {
      const name = canonical(r.name);
      await this.prisma.role.upsert({
        where: { name },
        update: {},
        create: { name, description: r.description },
      });
    }
    return this.findAll();
  }
  private async validate(ids: string[], actor: AuthUser) {
    const ps = await this.prisma.permission.findMany({
      where: { id: { in: ids } },
    });
    if (ps.length !== new Set(ids).size)
      throw new BadRequestException("Unknown permissions.");
    delegate(
      actor,
      ps.map((p) => p.code),
    );
    return ps;
  }
  async create(dto: CreateRoleDto, actor: AuthUser) {
    if (canonical(dto.name) !== dto.name)
      throw new BadRequestException("Use the canonical CCTBM role name.");
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(dto.name))
      throw new BadRequestException(
        "Use letters, numbers, underscores or hyphens for role names.",
      );
    await this.validate(dto.permissionIds ?? [], actor);
    if (await this.prisma.role.findUnique({ where: { name: dto.name } }))
      throw new ConflictException("Role already exists.");
    if (authConfig().mode === "keycloak")
      await new KeycloakAdmin(this.config).ensureRole(
        dto.name,
        dto.description,
      );
    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        rolePermissions: {
          create: (dto.permissionIds ?? []).map((permissionId) => ({
            permissionId,
          })),
        },
      },
      include,
    });
  }
  async update(id: string, dto: UpdateRoleDto, actor: AuthUser) {
    const role = await this.findOne(id);
    delegate(actor, (await grants(this.prisma, [role.name])).permissions);
    if (dto.name && dto.name !== role.name)
      throw new BadRequestException(
        "Role names cannot be changed after creation.",
      );
    const ps =
      dto.permissionIds === undefined
        ? null
        : await this.validate(dto.permissionIds, actor);
    const missing =
      role.name === "admin" && ps
        ? administratorPermissions.filter((n) => !ps.some((p) => p.code === n))
        : [];
    if (missing.length)
      throw new ForbiddenException(
        "admin requires these management permissions: " +
          missing.join(", ") +
          ". Other permissions can be removed. Use a custom role for restricted access.",
      );
    return this.prisma.$transaction(async (tx) => {
      if (ps) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        await tx.rolePermission.createMany({
          data: ps.map((p) => ({ roleId: id, permissionId: p.id })),
        });
      }
      return tx.role.update({
        where: { id },
        data: { description: dto.description },
        include,
      });
    });
  }
  async remove(id: string, actor: AuthUser) {
    const role = await this.findOne(id);
    delegate(actor, (await grants(this.prisma, [role.name])).permissions);
    if (["admin", "officer", "finance", "trader"].includes(role.name))
      throw new ForbiddenException("System roles cannot be deleted.");
    if (
      await this.prisma.user.count({
        where: { OR: [{ roleId: id }, { roleNames: { has: role.name } }] },
      })
    )
      throw new ConflictException("Role is assigned to users.");
    await this.prisma.role.delete({ where: { id } });
    return {
      message:
        "Local role retired; its Keycloak role has no CCTBM permissions.",
    };
  }
}
