"use server";

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { prisma } from "@/lib/prisma";
import { normalizePhoneForStorage } from "@/lib/phone";
import { adminUserDetailsSchema, editableUserRoles, userAccessChangeError } from "@/lib/admin-users";

class UserManagementError extends Error {}

export async function updateAdminUser(formData: FormData) {
  const actor = await getProtectedAppUser("/dashboard/admin?tab=users");
  if (actor.role !== Role.system_admin || !actor.isActive) redirect("/dashboard");
  const userId = String(formData.get("userId") || "");
  if (!userId) redirect("/dashboard/admin?tab=users");
  const href = `/dashboard/admin/users/${encodeURIComponent(userId)}`;
  const intent = String(formData.get("intent") || "");
  const parsed = adminUserDetailsSchema.safeParse(Object.fromEntries(["firstName", "lastName", "phone", "role"].map((key) => [key, String(formData.get(key) || "")])));
  let message = "User updated.";
  let failed = false;
  try {
    if (intent !== "details" && intent !== "access") throw new UserManagementError("Invalid user action.");
    if (intent === "details" && !parsed.success) throw new UserManagementError(parsed.error.issues[0]?.message || "Check the account fields.");
    if (intent === "access" && !["true", "false"].includes(String(formData.get("isActive")))) throw new UserManagementError("Invalid account status.");
    await prisma.$transaction(async (tx) => {
      const [currentActor, user] = await Promise.all([
        tx.user.findUnique({ where: { id: actor.id }, select: { role: true, isActive: true } }),
        tx.user.findUnique({ where: { id: userId }, include: { organization: { select: { type: true } } } })
      ]);
      if (currentActor?.role !== Role.system_admin || !currentActor.isActive) throw new UserManagementError("Administrator access is required.");
      if (!user) throw new UserManagementError("User not found.");
      if (String(formData.get("version")) !== user.updatedAt.toISOString()) throw new UserManagementError("This account changed since you opened it. Review the latest details and try again.");
      const details = intent === "details" && parsed.success ? parsed.data : null;
      const nextRole = details?.role ?? user.role;
      const nextActive = intent === "access" ? formData.get("isActive") === "true" : user.isActive;
      if (!editableUserRoles(user.role, user.organization?.type).includes(nextRole)) throw new UserManagementError("Choose a role compatible with the current organization.");
      const otherActiveAdmins = user.orgId ? await tx.user.count({ where: { orgId: user.orgId, id: { not: user.id }, isActive: true, role: { in: [Role.referent_admin, Role.aftercare_admin] } } }) : 0;
      const accessError = userAccessChangeError({ actorId: actor.id, targetId: user.id, role: user.role, isActive: user.isActive, nextRole, nextActive, orgId: user.orgId, otherActiveAdmins });
      if (accessError) throw new UserManagementError(accessError);
      const nextPhone = details ? normalizePhoneForStorage(details.phone) : user.phone;
      const data = details ? {
        firstName: details.firstName || null, lastName: details.lastName || null, phone: nextPhone, role: nextRole,
        ...(nextPhone !== user.phone ? { smsOptIn: false } : {})
      } : { isActive: nextActive };
      const updated = await tx.user.updateMany({ where: { id: user.id, updatedAt: user.updatedAt }, data });
      if (!updated.count) throw new UserManagementError("This account changed. Reload and try again.");
      await tx.adminAuditLog.create({ data: {
        actorUserId: actor.id, entityType: "user", entityId: user.id,
        action: details ? "user_details_updated" : nextActive ? "user_reactivated" : "user_deactivated",
        metadata: { before: { firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role, isActive: user.isActive, smsOptIn: user.smsOptIn }, after: data }
      } });
      message = details ? "Account details saved." : nextActive ? "User reactivated." : "User deactivated.";
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    failed = true;
    message = error instanceof UserManagementError ? error.message
      : error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" ? "Another administrator updated this account. Review the latest details and try again."
      : "The account could not be updated. Please try again.";
    if (!(error instanceof UserManagementError)) console.error("Admin user update failed", error instanceof Error ? error.name : "Unknown error");
  }
  revalidatePath("/dashboard/admin");
  revalidatePath(href);
  redirect(`${href}?${new URLSearchParams({ message, ...(failed ? { error: "1" } : {}) })}`);
}
