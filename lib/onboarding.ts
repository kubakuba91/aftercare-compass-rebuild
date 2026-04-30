import { OrganizationType } from "@prisma/client";
import {
  defaultRoleForAccountType,
  getClerkSessionUserId,
  getRequiredClerkIdentity
} from "@/lib/current-user";
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

export function draftKeyForAccountType(accountType: AccountType) {
  if (accountType === "referent") {
    return "referentDraft" as const;
  }

  if (accountType === "continued_care") {
    return "continuedCareDraft" as const;
  }

  return "soberLivingDraft" as const;
}

export function draftDestinationForAccountType(accountType: AccountType, step = 1) {
  if (accountType === "referent") {
    return `/onboarding/referent/${step}`;
  }

  if (accountType === "continued_care") {
    return "/onboarding/aftercare/continued-care/1";
  }

  return `/onboarding/aftercare/sober-living/${step}`;
}

export function destinationForAccountType(accountType: AccountType, alreadyOnboarded: boolean) {
  if (alreadyOnboarded) {
    return accountType === "referent" ? "/dashboard/referent" : "/dashboard/aftercare";
  }

  return draftDestinationForAccountType(accountType);
}

export async function ensureOnboardingUser(preferredAccountType?: AccountType) {
  const clerkUserId = await getClerkSessionUserId();

  if (!clerkUserId) {
    throw new Error("Authentication required");
  }

  const identity = await getRequiredClerkIdentity();
  const role = defaultRoleForAccountType(preferredAccountType ?? "referent");
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: identity.email }, { clerkUserId: identity.clerkUserId }]
    }
  });

  const data = {
    clerkUserId: identity.clerkUserId,
    email: identity.email,
    firstName: identity.firstName,
    lastName: identity.lastName,
    emailVerified: identity.emailVerified,
    emailVerifiedAt: identity.emailVerified ? new Date() : null
  };

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: preferredAccountType ? { ...data, role } : data
    });
  }

  return prisma.user.create({
    data: {
      ...data,
      role
    }
  });
}

export async function getOrCreateOnboardingDraft(accountType?: AccountType, resetActiveStep = true) {
  const user = await ensureOnboardingUser(accountType);
  const selectedAccountType = accountType ?? undefined;

  return prisma.onboardingDraft.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      selectedAccountType,
      activeStep: 1
    },
    update: selectedAccountType
      ? {
          selectedAccountType,
          ...(resetActiveStep ? { activeStep: 1 } : {}),
          completedAt: null
        }
      : {},
    include: { user: true }
  });
}

export async function getOnboardingDraftForSession() {
  const clerkUserId = await getClerkSessionUserId();

  if (!clerkUserId) {
    return null;
  }

  return prisma.onboardingDraft.findFirst({
    where: {
      user: { clerkUserId },
      completedAt: null
    }
  });
}

type ExistingOnboardingUser = NonNullable<
  Awaited<ReturnType<typeof findOnboardingUserBySession>>
>;

async function findOnboardingUserBySession(clerkUserId: string) {
  return prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      id: true,
      orgId: true,
      role: true,
      organization: {
        select: {
          type: true,
          id: true,
          _count: {
            select: { profiles: true }
          },
          referentDetails: {
            select: {
              onboardingCompletedAt: true
            }
          }
        }
      }
    }
  });
}

async function finishExistingUserSetup(existingUser: ExistingOnboardingUser, accountType: AccountType) {
  if (existingUser?.orgId) {
    const hasAftercareProfile = (existingUser.organization?._count.profiles ?? 0) > 0;
    const hasCompletedReferentOnboarding = Boolean(existingUser.organization?.referentDetails?.onboardingCompletedAt);
    const isAftercareOrg =
      existingUser.organization?.type === OrganizationType.aftercare_sober_living ||
      existingUser.organization?.type === OrganizationType.aftercare_continued_care;
    const hasStartedReferentOnboarding = Boolean(existingUser.organization?.referentDetails);

    if (
      existingUser.organization?.type !== accountTypeToOrgType[accountType] &&
      !hasAftercareProfile &&
      !hasStartedReferentOnboarding
    ) {
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

    if (existingUser.organization?.type === OrganizationType.referent) {
      return { alreadyOnboarded: hasCompletedReferentOnboarding, orgId: existingUser.orgId };
    }

    return { alreadyOnboarded: isAftercareOrg && hasAftercareProfile, orgId: existingUser.orgId };
  }
}

export async function ensureOnboardingOrganization(accountType: AccountType) {
  const clerkUserId = await getClerkSessionUserId();

  if (!clerkUserId) {
    throw new Error("Authentication required");
  }

  const sessionUser = await findOnboardingUserBySession(clerkUserId);
  const sessionResult = sessionUser ? await finishExistingUserSetup(sessionUser, accountType) : null;

  if (sessionResult) {
    return sessionResult;
  }

  const identity = await getRequiredClerkIdentity();
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: identity.email }, { clerkUserId: identity.clerkUserId }]
    },
    select: {
      id: true,
      orgId: true,
      role: true,
      organization: {
        select: {
          type: true,
          id: true,
          _count: {
            select: { profiles: true }
          },
          referentDetails: {
            select: {
              onboardingCompletedAt: true
            }
          }
        }
      }
    }
  });

  if (existingUser?.orgId) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        clerkUserId: identity.clerkUserId,
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
        emailVerified: identity.emailVerified,
        emailVerifiedAt: identity.emailVerified ? new Date() : null
      }
    });

    const existingResult = await finishExistingUserSetup(existingUser, accountType);

    if (existingResult) {
      return existingResult;
    }
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
