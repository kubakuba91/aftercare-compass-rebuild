import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { InvitationConflict, lockInvitations, normalizeInviteEmail, pendingReferentInvitations, uniqueInvitedOrganization } from "@/lib/organization-invitations";
import { Role } from "@prisma/client";
import { hasValidClerkRuntimeConfig } from "@/lib/clerk-config";
import { prisma } from "@/lib/prisma";

export async function getClerkSessionUserId() {
  if (!hasValidClerkRuntimeConfig()) {
    return null;
  }

  const { userId } = await auth();
  return userId;
}

export async function getRequiredClerkIdentity() {
  if (!hasValidClerkRuntimeConfig()) {
    throw new Error("Authentication required");
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Authentication required");
  }

  const email = clerkUser.emailAddresses.find(
    (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;

  if (!email) {
    throw new Error("Primary email required");
  }

  return {
    clerkUserId: clerkUser.id,
    email: normalizeInviteEmail(email),
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    emailVerified: clerkUser.emailAddresses.some(
      (emailAddress) =>
        emailAddress.id === clerkUser.primaryEmailAddressId &&
        emailAddress.verification?.status === "verified"
    )
  };
}

export function isClerkIdentityError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message === "Authentication required" || error.message === "Primary email required")
  );
}

export function defaultRoleForAccountType(accountType: string): Role {
  if (accountType === "referent") {
    return Role.referent_admin;
  }

  return Role.aftercare_admin;
}

export async function getCurrentAppUser() {
  const clerkUserId = await getClerkSessionUserId();

  if (!clerkUserId) {
    return null;
  }

  const appUser = await prisma.user.findUnique({
    where: { clerkUserId },
    include: { organization: true }
  });

  if (appUser?.orgId) {
    return appUser;
  }

  const identity = await getRequiredClerkIdentity();
  if (!identity.emailVerified) return appUser;
  try {
    return await prisma.$transaction(async tx => {
      await lockInvitations(tx);
      const matches = await tx.user.findMany({
        where: { OR: [{ clerkUserId }, { email: { equals: identity.email, mode: "insensitive" } }] },
        include: { organization: true }
      });
      // Never rebind an email to a different authenticated identity.
      if (matches.length > 1 || matches.some(user => user.clerkUserId !== clerkUserId)) throw new InvitationConflict();
      const existing = matches[0];
      if (existing?.orgId) return existing;
      const referentInvites = await pendingReferentInvitations(tx, [identity.email]);
      const organizationInvites = await tx.organizationInvite.findMany({
        where: { email: { equals: identity.email, mode: "insensitive" }, status: "pending" },
        include: { aftercareProfileAssignments: true }, orderBy: { createdAt: "asc" }
      });
      const orgId = uniqueInvitedOrganization([...referentInvites, ...organizationInvites]);
      if (!orgId) return existing ?? null;
      const invite = organizationInvites[0];
      const role = invite?.role ?? Role.referent_manager;
      const data = {
        email: identity.email, firstName: identity.firstName, lastName: identity.lastName,
        orgId, role, emailVerified: true, emailVerifiedAt: new Date(),
        ...(role === Role.aftercare_manager && invite ? { aftercareManagerScope: invite.aftercareManagerScope } : {})
      };
      let user;
      if (existing) {
        const updated = await tx.user.updateMany({ where: { id: existing.id, orgId: null }, data });
        user = await tx.user.findUniqueOrThrow({ where: { id: existing.id }, include: { organization: true } });
        if (!updated.count) return user;
      } else {
        user = await tx.user.create({ data: { ...data, clerkUserId }, include: { organization: true } });
      }
      if (invite) {
        await tx.organizationInvite.updateMany({
          where: { id: invite.id, status: "pending", orgId },
          data: { status: "accepted", acceptedByUserId: user.id, acceptedAt: new Date() }
        });
        if (role === Role.aftercare_manager && invite.aftercareManagerScope === "assigned_profiles") {
          await tx.aftercareProfileManagerAssignment.createMany({
            data: invite.aftercareProfileAssignments.map(assignment => ({ userId: user.id, profileId: assignment.profileId })), skipDuplicates: true
          });
        }
      }
      if (referentInvites.length) {
        const details = await tx.referentOrganization.findUniqueOrThrow({ where: { orgId } });
        await tx.referentOrganization.update({ where: { orgId }, data: {
          invitedTeamEmails: details.invitedTeamEmails.filter(email => normalizeInviteEmail(email) !== identity.email)
        } });
      }
      return user;
    });
  } catch (error) {
    if (error instanceof InvitationConflict) redirect("/onboarding/invitation-conflict");
    throw error;
  }
}

export async function requireCurrentAppUser() {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    throw new Error("App user not found");
  }

  return appUser;
}
