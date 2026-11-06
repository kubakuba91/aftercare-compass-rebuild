import { aftercarePlans } from "./plans";
import { canDisplayVerifiedBadge, type OrganizationGateContext } from "./feature-gates";
import type { ProfileOwnershipStatus } from "@prisma/client";

type SubscriptionContext = {
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  stripeSubscriptionId: string | null;
};

type SearchProfile = {
  programName: string;
  publicCity: string | null;
  publicState: string | null;
  description: string | null;
  verificationTier?: number | null;
  ownershipStatus?: ProfileOwnershipStatus | null;
  organization: (SubscriptionContext & OrganizationGateContext) | null;
};

export function hasActivePaidSubscription(organization: SubscriptionContext | null): boolean {
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

// Rank the complete filtered set before pagination. Equal relevance prioritizes
// verified, then claimed, then paid profiles. Stable ties retain the database's
// updatedAt-desc/id-asc order.
export function rankRecommendedProfiles<T extends SearchProfile>(profiles: readonly T[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  return profiles.map(profile => ({
    profile,
    relevance: relevance(profile, normalized),
    verified: Number(canDisplayVerifiedBadge(profile.organization, profile)),
    claimed: Number(profile.ownershipStatus === "claimed"),
    paid: Number(hasActivePaidSubscription(profile.organization))
  }))
    .sort((a, b) => b.relevance - a.relevance || b.verified - a.verified || b.claimed - a.claimed || b.paid - a.paid)
    .map(item => item.profile);
}
