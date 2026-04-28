import { currentUser } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export function defaultRoleForAccountType(accountType: string): Role {
  if (accountType === "referent") {
    return Role.referent_admin;
  }

  return Role.aftercare_admin;
}

export async function getCurrentAppUser() {
  const identity = await getRequiredClerkIdentity();

  return prisma.user.findUnique({
    where: { clerkUserId: identity.clerkUserId },
    include: { organization: true }
  });
}

export async function requireCurrentAppUser() {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    throw new Error("App user not found");
  }

  return appUser;
}

