export const REFERENT_TRIAL_DAYS = 30;
const DAY_MS = 86_400_000;
export type ReferentAccess = {
  subscriptionStatus?: string | null;
  stripeSubscriptionId?: string | null;
  referentTrialStartedAt?: Date | null;
  referentTrialEndsAt?: Date | null;
};
export function trialEndFrom(start: Date, days = REFERENT_TRIAL_DAYS) {
  return new Date(start.getTime() + days * DAY_MS);
}
export function hasReferentAccess(org: ReferentAccess | null | undefined, now = new Date()) {
  if (!org) return false;
  if (org.subscriptionStatus === "active") return true;
  return org.subscriptionStatus === "trialing" && !!org.referentTrialEndsAt && org.referentTrialEndsAt > now;
}
export function canStartReferentTrial(org: ReferentAccess) {
  return !org.referentTrialStartedAt && !org.stripeSubscriptionId && org.subscriptionStatus === "incomplete";
}
export function trialDaysRemaining(end: Date, now = new Date()) {
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY_MS));
}
