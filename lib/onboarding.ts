import { OrganizationType } from "@prisma/client";
import { getRequiredClerkIdentity, defaultRoleForAccountType } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const accountTypeToOrgType = {
  referent: OrganizationType.referent,
  sober_living: OrganizationType.aftercare_sober_living,
  continued_care: OrganizationType.aftercare_continued_care
} as const;

export type AccountType = keyof typeof accountTypeToOrgType;

export function isAccountType(value: string): value is AccountType {
  return value in accountTypeToOrgType;
}

export async function ensureOnboardingOrganization(accountType: AccountType) {
  const identity = await getRequiredClerkIdentity();
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: identity.email }, { clerkUserId: identity.clerkUserId }]
    },
    select: {
      id: true,
      orgId: true,
      organization: {
        select: {
          type: true,
          id: true,
          _count: {
            select: { profiles: true }
          }
        }
      }
    }
  });

  if (existingUser?.orgId) {
    const hasAftercareProfile = (existingUser.organization?._count.profiles ?? 0) > 0;
    const isAftercareOrg =
      existingUser.organization?.type === OrganizationType.aftercare_sober_living ||
      existingUser.organization?.type === OrganizationType.aftercare_continued_care;

    if (!isAftercareOrg && accountType !== "referent" && !hasAftercareProfile) {
      const role = defaultRoleForAccountType(accountType);

      await prisma.organization.update({
        where: { id: existingUser.orgId },
        data: { type: accountTypeToOrgType[accountType] }
      });

      await prisma.user.update({
        where: { id: existingUser.id },
        data: { role }
      });

      return { alreadyOnboarded: false, orgId: existingUser.orgId };
    }

    return { alreadyOnboarded: !isAftercareOrg || hasAftercareProfile, orgId: existingUser.orgId };
  }

  const role = defaultRoleForAccountType(accountType);
  const organizationName =
    accountType === "referent"
      ? `${identity.email} Referent Organization`
      : `${identity.email} Aftercare Organization`;

  const organization = await prisma.organization.create({
    data: {
      type: accountTypeToOrgType[accountType],
      name: organizationName,
      email: identity.email
    },
    select: { id: true }
  });

  const userData = {
    clerkUserId: identity.clerkUserId,
    email: identity.email,
    firstName: identity.firstName,
    lastName: identity.lastName,
    role,
    orgId: organization.id,
    emailVerified: identity.emailVerified,
    emailVerifiedAt: identity.emailVerified ? new Date() : null
  };

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: userData
    });
  } else {
    await prisma.user.create({
      data: userData
    });
  }

  return { alreadyOnboarded: false, orgId: organization.id };
}

export function destinationForAccountType(accountType: AccountType, alreadyOnboarded: boolean) {
  if (alreadyOnboarded) {
    return accountType === "referent" ? "/dashboard/referent" : "/dashboard/aftercare";
  }

  if (accountType === "referent") {
    return "/dashboard/referent";
  }

  return `/onboarding/aftercare/profile?type=${accountType}`;
}
