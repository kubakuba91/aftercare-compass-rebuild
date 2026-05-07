import { auth, currentUser } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getClerkSessionUserId() {
  const { userId } = await auth();
  return userId;
}

export async function getRequiredClerkIdentity() {
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
    email,
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
  const invitedReferentOrg = await prisma.referentOrganization.findFirst({
    where: {
      invitedTeamEmails: { has: identity.email.toLowerCase() },
      onboardingCompletedAt: { not: null }
    },
    select: {
      orgId: true,
      invitedTeamEmails: true
    }
  });

  if (!invitedReferentOrg) {
    return appUser;
  }

  const user = appUser
    ? await prisma.user.update({
        where: { id: appUser.id },
        data: {
          clerkUserId: identity.clerkUserId,
          email: identity.email,
          firstName: identity.firstName,
          lastName: identity.lastName,
          role: Role.referent_manager,
          orgId: invitedReferentOrg.orgId,
          emailVerified: identity.emailVerified,
          emailVerifiedAt: identity.emailVerified ? new Date() : null
        },
        include: { organization: true }
      })
    : await prisma.user.create({
        data: {
          clerkUserId: identity.clerkUserId,
          email: identity.email,
          firstName: identity.firstName,
          lastName: identity.lastName,
          role: Role.referent_manager,
          orgId: invitedReferentOrg.orgId,
          emailVerified: identity.emailVerified,
          emailVerifiedAt: identity.emailVerified ? new Date() : null
        },
        include: { organization: true }
      });

  await prisma.referentOrganization.update({
    where: { orgId: invitedReferentOrg.orgId },
    data: {
      invitedTeamEmails: invitedReferentOrg.invitedTeamEmails.filter(
        (email) => email.toLowerCase() !== identity.email.toLowerCase()
      )
    }
  });

  return user;
}

export async function requireCurrentAppUser() {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    throw new Error("App user not found");
  }

  return appUser;
}
