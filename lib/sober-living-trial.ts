export const SOBER_LIVING_TRIAL_DAYS = 30;
export const SOBER_LIVING_TRIAL_PLAN = "professional"; // Aftercare Basic

export type SoberLivingTrialContext = {
  type?: string | null;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
  stripeSubscriptionId?: string | null;
  trialStartedAt?: Date | null;
  trialEndsAt?: Date | null;
};

export function isSoberLivingTrial(org: SoberLivingTrialContext | null | undefined) {
  return org?.type === "aftercare_sober_living" && org.subscriptionStatus === "trialing";
}

export function soberLivingTrialExpired(org: SoberLivingTrialContext | null | undefined, now = new Date()) {
  return isSoberLivingTrial(org) && (!org?.trialEndsAt || org.trialEndsAt <= now);
}

export function effectiveAftercarePlanKey(org: SoberLivingTrialContext | null | undefined, now = new Date()) {
  return soberLivingTrialExpired(org, now) ? "claimed_listing" : org?.subscriptionPlan;
}

export function canStartSoberLivingTrial(org: SoberLivingTrialContext | null | undefined) {
  return !!org && org.type === "aftercare_sober_living" && !org.trialStartedAt && !org.trialEndsAt &&
    !org.stripeSubscriptionId && (!org.subscriptionPlan || org.subscriptionPlan === "claimed_listing") &&
    (!org.subscriptionStatus || org.subscriptionStatus === "incomplete" || org.subscriptionStatus === "active");
}

// The same predicates are applied atomically by the database to prevent repeat trials.
export function soberLivingTrialStartWhere(orgId: string) {
  return {
    id: orgId,
    type: "aftercare_sober_living" as const,
    stripeSubscriptionId: null,
    trialStartedAt: null,
    trialEndsAt: null,
    AND: [
      { OR: [{ subscriptionPlan: null }, { subscriptionPlan: "claimed_listing" }] },
      { OR: [{ subscriptionStatus: null }, { subscriptionStatus: { in: ["incomplete", "active"] as ("incomplete" | "active")[] } }] }
    ]
  };
}
