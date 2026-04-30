import { redirect } from "next/navigation";
import { OrganizationType, Role } from "@prisma/client";
import { getClerkSessionUserId, getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { maxSoberLivingStep } from "@/lib/sober-living-onboarding";

export function signInToContinuePath() {
  const params = new URLSearchParams({
    reason: "session_timeout"
  });

  return `/sign-in?${params.toString()}`;
}

export async function getProtectedAppUser(_returnTo: string) {
  const clerkUserId = await getClerkSessionUserId();

  if (!clerkUserId) {
    redirect(signInToContinuePath());
  }

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect("/onboarding/account-type");
  }

  return appUser;
}

export async function redirectToDashboardDestination(returnTo = "/dashboard") {
  const appUser = await getProtectedAppUser(returnTo);

  if (appUser.role === Role.system_admin) {
    redirect("/dashboard/admin");
  }

  if (appUser.role === Role.referent_admin || appUser.role === Role.referent_manager) {
    redirect("/dashboard/referent");
  }

  if (appUser.role === Role.aftercare_admin || appUser.role === Role.aftercare_manager) {
    redirect("/dashboard/aftercare");
  }

  redirect("/onboarding/account-type");
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
