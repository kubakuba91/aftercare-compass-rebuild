import {
  OrganizationType,
  ProfileOwnershipStatus,
  SubscriptionStatus
} from "@prisma/client";
import { aftercarePlans, referentPlans } from "@/lib/plans";

export type PlanLimit = number | "unlimited";
export type AftercarePlanKey = keyof typeof aftercarePlans;
export type ReferentPlanKey = keyof typeof referentPlans;

type OrganizationGateContext = {
  type?: OrganizationType | null;
  subscriptionPlan?: string | null;
  subscriptionStatus?: SubscriptionStatus | null;
};

type ProfileGateContext = {
  ownershipStatus?: ProfileOwnershipStatus | null;
};

export function normalizeAftercarePlanKey(planKey: string | null | undefined): AftercarePlanKey {
  if (planKey === "basic") {
    return "professional";
  }

  if (planKey && planKey in aftercarePlans) {
    return planKey as AftercarePlanKey;
  }

  return "claimed_listing";
}

export function normalizeReferentPlanKey(planKey: string | null | undefined): ReferentPlanKey {
  if (planKey && planKey in referentPlans) {
    return planKey as ReferentPlanKey;
  }

  return "starter";
}

export function isSubscriptionUsable(status: SubscriptionStatus | null | undefined) {
  if (!status) {
    return true;
  }

  return status === SubscriptionStatus.active || status === SubscriptionStatus.trialing;
}

export function getAftercarePlan(planKey: string | null | undefined) {
  return aftercarePlans[normalizeAftercarePlanKey(planKey)];
}

export function getReferentPlan(planKey: string | null | undefined) {
  return referentPlans[normalizeReferentPlanKey(planKey)];
}

export function getAftercareManagerLimit(planKey: string | null | undefined): PlanLimit {
  return getAftercarePlan(planKey).managers;
}

export function getAftercareProfileLimit(planKey: string | null | undefined): PlanLimit {
  return getAftercarePlan(planKey).profiles;
}

export function getReferentTeamLimit(planKey: string | null | undefined): PlanLimit {
  return getReferentPlan(planKey).teamMembers;
}

export function canSubmitReferrals(organization: OrganizationGateContext | null | undefined) {
  if (!organization || organization.type !== OrganizationType.referent) {
    return false;
  }

  return getReferentPlan(organization.subscriptionPlan).submitReferrals &&
    isSubscriptionUsable(organization.subscriptionStatus);
}

export function canReceiveDirectReferrals(
  organization: OrganizationGateContext | null | undefined,
  profile?: ProfileGateContext | null
) {
  if (
    !organization ||
    (
      organization.type !== OrganizationType.aftercare_sober_living &&
      organization.type !== OrganizationType.aftercare_continued_care
    )
  ) {
    return false;
  }

  if (profile?.ownershipStatus && profile.ownershipStatus !== ProfileOwnershipStatus.claimed) {
    return false;
  }

  const plan = getAftercarePlan(organization.subscriptionPlan);

  return plan.directReferralIntake && isSubscriptionUsable(organization.subscriptionStatus);
}

export function canUseLiveAvailability(
  organization: OrganizationGateContext | null | undefined,
  profile?: ProfileGateContext | null
) {
  if (!organization) {
    return false;
  }

  if (profile?.ownershipStatus && profile.ownershipStatus !== ProfileOwnershipStatus.claimed) {
    return false;
  }

  const plan = getAftercarePlan(organization.subscriptionPlan);

  return plan.liveAvailability && isSubscriptionUsable(organization.subscriptionStatus);
}

export function canUseInAppMessaging(organization: OrganizationGateContext | null | undefined) {
  if (!organization) {
    return false;
  }

  if (organization.type === OrganizationType.referent) {
    return getReferentPlan(organization.subscriptionPlan).messaging &&
      isSubscriptionUsable(organization.subscriptionStatus);
  }

  return getAftercarePlan(organization.subscriptionPlan).messaging &&
    isSubscriptionUsable(organization.subscriptionStatus);
}

export function isWithinPlanLimit(limit: PlanLimit, currentCount: number, addedCount = 1) {
  return limit === "unlimited" || currentCount + addedCount <= limit;
}

