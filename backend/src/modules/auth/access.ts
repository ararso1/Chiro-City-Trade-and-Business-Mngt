import { ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
export const canonical = (name: string) =>
  ["ADMIN", "OFFICER", "FINANCE", "TRADER"].includes(name)
    ? name.toLowerCase()
    : name;
export const has = (actor: any, permission: string) =>
  Boolean(actor.permissions?.includes(permission));
export function delegate(actor: any, permissions: string[]) {
  if (permissions.some((p) => !has(actor, p)))
    throw new ForbiddenException(
      "You cannot manage permissions beyond your own access.",
    );
}
export async function grants(prisma: PrismaService, names: string[]) {
  const rows = await prisma.role.findMany({
    where: { name: { in: [...new Set(names.map(canonical))] } },
    include: { rolePermissions: { include: { permission: true } } },
  });
  return {
    roles: rows
      .map((r) => r.name)
      .sort((a, b) =>
        a === "admin" ? -1 : b === "admin" ? 1 : a.localeCompare(b),
      ),
    permissions: [
      ...new Set(
        rows.flatMap((r) =>
          r.rolePermissions
            .map((p) => p.permission.code)
            .filter((p) => p !== "*"),
        ),
      ),
    ],
  };
}
export async function profile(prisma: PrismaService, id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!user?.isActive)
    throw new ForbiddenException("This account is disabled.");
  const access = await grants(
    prisma,
    user.roleNames?.length ? user.roleNames : [user.role.name],
  );
  return {
    id: user.id,
    sub: user.id,
    name: user.name,
    email: user.email,
    role: access.roles[0] || user.role.name,
    ...access,
  };
}
