import { aftercarePlans } from "./plans";

type SearchProfile = {
  programName: string;
  publicCity: string | null;
  publicState: string | null;
  description: string | null;
  organization: {
    subscriptionStatus: string | null;
    subscriptionPlan: string | null;
    stripeSubscriptionId: string | null;
  } | null;
};

export function hasActivePaidSubscription(organization: SearchProfile["organization"]): boolean {
  const key = organization?.subscriptionPlan === "basic" ? "professional" : organization?.subscriptionPlan;
  const plan = key && Object.prototype.hasOwnProperty.call(aftercarePlans, key)
    ? aftercarePlans[key as keyof typeof aftercarePlans] : null;
  return Boolean(organization?.subscriptionStatus === "active" &&
    organization.stripeSubscriptionId && plan && plan.monthlyPrice > 0);
}

function relevance(profile: SearchProfile, query: string): number {
  if (!query) return 0;
  const name = profile.programName.toLowerCase();
  if (name === query) return 4;
  if (name.startsWith(query)) return 3;
  if (name.includes(query)) return 2;
  if ([profile.publicCity, profile.publicState].some(value => value?.toLowerCase().includes(query))) return 1;
  return 0;
}

// Stable ties retain the database's updatedAt-desc/id-asc ordering. Rank the
// complete filtered candidate set before pagination so boosts span page boundaries.
export function rankRecommendedProfiles<T extends SearchProfile>(profiles: readonly T[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  return profiles.map(profile => ({ profile, relevance: relevance(profile, normalized), paid: Number(hasActivePaidSubscription(profile.organization)) }))
    .sort((a, b) => b.relevance - a.relevance || b.paid - a.paid)
    .map(item => item.profile);
}
