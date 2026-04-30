import { redirect } from "next/navigation";
import { OrganizationType, Role } from "@prisma/client";
import { getClerkSessionUserId, getCurrentAppUser } from "@/lib/current-user";
import { hasDatabaseConfig } from "@/lib/database-status";
import { prisma } from "@/lib/prisma";
import { maxReferentStep } from "@/lib/referent-onboarding";
import { maxSoberLivingStep } from "@/lib/sober-living-onboarding";

export async function getProtectedAppUser(_returnTo: string) {
  if (!hasDatabaseConfig()) {
    redirect("/setup?missing=database");
  }

  const clerkUserId = await getClerkSessionUserId();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect("/onboarding/account-type");
  }

  return appUser;
}

export async function getAuthenticatedLandingPath() {
  if (!hasDatabaseConfig()) {
    return "/setup?missing=database";
  }

  const clerkUserId = await getClerkSessionUserId();

  if (!clerkUserId) {
    return "/sign-in";
  }

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return "/onboarding/account-type";
  }

  if (appUser.role === Role.system_admin) {
    return "/dashboard/admin";
  }

  if (appUser.role === Role.referent_admin || appUser.role === Role.referent_manager) {
    if (!appUser.orgId) {
      return "/onboarding/account-type";
    }

    const referentDetails = await prisma.referentOrganization.findUnique({
      where: { orgId: appUser.orgId },
      select: {
        onboardingStep: true,
        onboardingCompletedAt: true
      }
    });

    if (!referentDetails?.onboardingCompletedAt) {
      const resumeStep = Math.min(
        Math.max(referentDetails?.onboardingStep ?? 1, 1),
        maxReferentStep
      );

      return `/onboarding/referent/${resumeStep}`;
    }

    return "/dashboard/referent";
  }

  if (appUser.role !== Role.aftercare_admin && appUser.role !== Role.aftercare_manager) {
    return "/onboarding/account-type";
  }

  if (!appUser.orgId) {
    return "/onboarding/account-type";
  }

  const profiles = await prisma.aftercareProfile.findMany({
    where: { orgId: appUser.orgId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      type: true,
      onboardingStep: true,
      onboardingCompletedAt: true
    }
  });

  if (profiles.length === 0) {
    const profileType =
      appUser.organization?.type === OrganizationType.aftercare_continued_care
        ? "continued_care"
        : "sober_living";

    return profileType === "sober_living"
      ? "/onboarding/aftercare/sober-living/1"
      : `/onboarding/aftercare/profile?type=${profileType}`;
  }

  const incompleteSoberLivingProfile = profiles.find(
    (profile) => profile.type === "sober_living" && !profile.onboardingCompletedAt
  );

  if (incompleteSoberLivingProfile) {
    const resumeStep = Math.min(
      Math.max(incompleteSoberLivingProfile.onboardingStep ?? 1, 1),
      maxSoberLivingStep
    );

    return `/onboarding/aftercare/sober-living/${resumeStep}?profileId=${incompleteSoberLivingProfile.id}`;
  }

  return "/dashboard/aftercare";
}

export async function redirectToDashboardDestination(returnTo = "/dashboard") {
  const destination = await getAuthenticatedLandingPath();

  if (destination === "/sign-in") {
    redirect(returnTo === "/dashboard" ? "/sign-in" : `/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
  }

  redirect(destination);
}

export async function getAftercareDashboardUser(returnTo = "/dashboard/aftercare") {
  const appUser = await getProtectedAppUser(returnTo);

  if (appUser.role !== Role.aftercare_admin && appUser.role !== Role.aftercare_manager) {
    redirect("/dashboard");
  }

  if (!appUser.orgId) {
    redirect("/onboarding/account-type");
  }

  return appUser as typeof appUser & { orgId: string };
}

export async function redirectIncompleteAftercareOnboarding(orgId: string) {
  const profiles = await prisma.aftercareProfile.findMany({
    where: { orgId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      type: true,
      onboardingStep: true,
      onboardingCompletedAt: true
    }
  });

  if (profiles.length === 0) {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { type: true }
    });
    const profileType =
      organization?.type === OrganizationType.aftercare_continued_care
        ? "continued_care"
        : "sober_living";

    if (profileType === "sober_living") {
      redirect("/onboarding/aftercare/sober-living/1");
    }

    redirect(`/onboarding/aftercare/profile?type=${profileType}`);
  }

  const incompleteSoberLivingProfile = profiles.find(
    (profile) => profile.type === "sober_living" && !profile.onboardingCompletedAt
  );

  if (incompleteSoberLivingProfile) {
    const resumeStep = Math.min(
      Math.max(incompleteSoberLivingProfile.onboardingStep ?? 1, 1),
      maxSoberLivingStep
    );
    redirect(
      `/onboarding/aftercare/sober-living/${resumeStep}?profileId=${incompleteSoberLivingProfile.id}`
    );
  }
}
