import { AftercareManagerScope, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAftercareManagerLimit, getReferentTeamLimit, isWithinPlanLimit } from "@/lib/feature-gates";

export const membershipConflictMessage = "This email is already associated with another organization. Contact support if you need to transfer access.";
export class InvitationConflict extends Error {}
export function uniqueInvitedOrganization(invites: Array<{ orgId: string }>) {
  const ids = new Set(invites.map(invite => invite.orgId));
  if (ids.size > 1) throw new InvitationConflict("Conflicting invitations require support.");
  return [...ids][0] as string | undefined;
}
export const normalizeInviteEmail = (email: string) => email.trim().toLowerCase();

// Both invitation stores and acceptance use this transaction lock. A competing
// invitation cannot pass its check before the first invitation is committed.
export async function lockInvitations(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(194723, 1)`;
}

export async function pendingReferentInvitations(tx: Prisma.TransactionClient, emails: string[]) {
  if (!emails.length) return [];
  return tx.$queryRaw<Array<{ orgId: string; email: string }>>(Prisma.sql`
    SELECT r."orgId", lower(trim(e.email)) AS email
    FROM "ReferentOrganization" r CROSS JOIN LATERAL unnest(r."invitedTeamEmails") AS e(email)
    WHERE lower(trim(e.email)) IN (${Prisma.join(emails.map(normalizeInviteEmail))})
  `);
}

export async function assertInvitationAvailable(tx: Prisma.TransactionClient, emails: string[], orgId: string | null) {
  const normalized = [...new Set(emails.map(normalizeInviteEmail))];
  if (!normalized.length) return;
  const users = await tx.user.findMany({ where: { OR: normalized.map(email => ({ email: { equals: email, mode: "insensitive" as const } })) }, select: { email: true, orgId: true } });
  const invites = await tx.organizationInvite.findMany({ where: { status: "pending", OR: normalized.map(email => ({ email: { equals: email, mode: "insensitive" as const } })) }, select: { email: true, orgId: true } });
  const referentInvites = await pendingReferentInvitations(tx, normalized);
  const conflict = users.find(user => user.orgId && user.orgId !== orgId) ?? [...invites, ...referentInvites].find(invite => invite.orgId !== orgId);
  if (conflict) throw new InvitationConflict(`${normalizeInviteEmail(conflict.email)}: ${membershipConflictMessage}`);
}

export async function saveTeamInvitations(input: {
  orgId: string; emails: string[]; actorId: string; role: "referent_manager" | "aftercare_manager";
  scope?: AftercareManagerScope; profileIds?: string[];
}) {
  return prisma.$transaction(async tx => {
    await lockInvitations(tx);
    await assertInvitationAvailable(tx, input.emails, input.orgId);
    const org = await tx.organization.findUniqueOrThrow({ where: { id: input.orgId }, include: { users: true, invites: { where: { status: "pending" } }, referentDetails: true } });
    const pending = [...(org.referentDetails?.invitedTeamEmails ?? []), ...org.invites.map(invite => invite.email)];
    const taken = new Set([...org.users.map(user => user.email), ...pending].map(normalizeInviteEmail));
    const emails = [...new Set(input.emails.map(normalizeInviteEmail))].filter(email => !taken.has(email));
    const limit = input.role === Role.referent_manager ? getReferentTeamLimit(org.subscriptionPlan) : getAftercareManagerLimit(org.subscriptionPlan);
    if (!isWithinPlanLimit(limit, org.users.filter(user => user.isActive).length + new Set(pending.map(normalizeInviteEmail)).size, emails.length)) throw new InvitationConflict("Your current plan does not have enough manager seats.");
    if (input.role === Role.referent_manager) {
      await tx.referentOrganization.update({ where: { orgId: input.orgId }, data: { invitedTeamEmails: [...(org.referentDetails?.invitedTeamEmails ?? []), ...emails] } });
    } else {
      for (const email of emails) await tx.organizationInvite.upsert({
        where: { orgId_email: { orgId: input.orgId, email } },
        create: { orgId: input.orgId, email, role: input.role, invitedByUserId: input.actorId, aftercareManagerScope: input.scope, aftercareProfileAssignments: { create: (input.profileIds ?? []).map(profileId => ({ profileId })) } },
        update: { status: "pending", acceptedAt: null, acceptedByUserId: null, role: input.role, invitedByUserId: input.actorId, aftercareManagerScope: input.scope, aftercareProfileAssignments: { deleteMany: {}, create: (input.profileIds ?? []).map(profileId => ({ profileId })) } }
      });
    }
    return emails;
  });
}
