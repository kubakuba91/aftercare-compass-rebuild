import { OrganizationType, Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { normalizePhoneNumber } from "@/lib/phone";

export const NEW_USER_DAYS = 7;
export const userRoleLabels: Record<Role, string> = {
  system_admin: "System administrator",
  referent_admin: "Referent administrator",
  referent_manager: "Referent manager",
  aftercare_admin: "Aftercare administrator",
  aftercare_manager: "Aftercare manager"
};
export function newUserCutoff(now = new Date()) {
  return new Date(now.getTime() - NEW_USER_DAYS * 24 * 60 * 60 * 1000);
}
export function userDirectoryWhere(input: { q?: string; role?: string; status?: string; joined?: string }, now = new Date()): Prisma.UserWhereInput {
  const words = input.q?.trim().slice(0, 200).split(/\s+/).filter(Boolean) ?? [];
  return {
    ...(Object.values(Role).includes(input.role as Role) ? { role: input.role as Role } : {}),
    ...(input.status === "active" ? { isActive: true } : input.status === "inactive" ? { isActive: false } : {}),
    ...(input.joined === "new" ? { createdAt: { gte: newUserCutoff(now) } } : {}),
    AND: words.map((word) => ({ OR: [
      { firstName: { contains: word, mode: "insensitive" } },
      { lastName: { contains: word, mode: "insensitive" } },
      { email: { contains: word, mode: "insensitive" } },
      { organization: { name: { contains: word, mode: "insensitive" } } }
    ] }))
  };
}
export function editableUserRoles(role: Role, organizationType?: OrganizationType | null): Role[] {
  if (role === Role.system_admin || !organizationType) return [role];
  return organizationType === OrganizationType.referent
    ? [Role.referent_admin, Role.referent_manager]
    : [Role.aftercare_admin, Role.aftercare_manager];
}
export function isOrganizationAdmin(role: Role) {
  return role === Role.referent_admin || role === Role.aftercare_admin;
}
export const adminUserDetailsSchema = z.object({
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  phone: z.string().trim().max(40).refine((value) => !value || Boolean(normalizePhoneNumber(value)), "Enter a valid phone number."),
  role: z.enum(Role)
});
export function userAccessChangeError(input: { actorId: string; targetId: string; role: Role; isActive: boolean; nextRole: Role; nextActive: boolean; orgId: string | null; otherActiveAdmins: number }) {
  if (input.actorId === input.targetId && (!input.nextActive || input.role !== input.nextRole)) return "You cannot deactivate your own account or change your own role.";
  if (input.role === Role.system_admin && (!input.nextActive || input.nextRole !== Role.system_admin)) return "System administrator access cannot be changed here.";
  if (input.orgId && input.isActive && isOrganizationAdmin(input.role) && (!input.nextActive || !isOrganizationAdmin(input.nextRole)) && !input.otherActiveAdmins) {
    return "This is the organization’s last active administrator. Assign another administrator first.";
  }
  return null;
}
