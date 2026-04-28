import { currentUser } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";

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

