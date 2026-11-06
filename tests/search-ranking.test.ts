import assert from "node:assert/strict";
import { hasActivePaidSubscription, rankRecommendedProfiles } from "../lib/search-ranking";
import { normalizeSearchSort } from "../lib/search-sort";

const paid = { subscriptionStatus: "active", subscriptionPlan: "professional", stripeSubscriptionId: "sub_paid" } as const;
const free = { ...paid, subscriptionPlan: "claimed_listing" };
const profile = (id: string, programName: string, organization = free) => ({ id, programName, organization, publicCity: "Boston", publicState: "MA", description: "Recovery services" });
assert.equal(hasActivePaidSubscription(paid), true);
for (const subscriptionStatus of ["trialing", "past_due", "canceled", "incomplete", "unpaid", "paused"]) {
  assert.equal(hasActivePaidSubscription({ ...paid, subscriptionStatus }), false);
}
for (const organization of [null, free, { ...paid, stripeSubscriptionId: null }, { ...paid, subscriptionPlan: "unknown" }]) {
  assert.equal(hasActivePaidSubscription(organization), false);
}
assert.equal(hasActivePaidSubscription({ ...paid, subscriptionPlan: "basic" }), true);
const exact = profile("exact", "Recovery");
const weakerPaid = profile("weaker", "Recovery House", paid);
assert.deepEqual(rankRecommendedProfiles([weakerPaid, exact], " recovery ").map(p => p.id), ["exact", "weaker"]);
const equalFree = profile("free", "Recovery House");
assert.deepEqual(rankRecommendedProfiles([equalFree, weakerPaid], "Recovery").map(p => p.id), ["weaker", "free"]);
const all = Array.from({ length: 51 }, (_, i) => profile(String(i), "House"));
all.push(profile("paid-last", "House", paid));
assert.equal(rankRecommendedProfiles(all, "").slice(0, 50)[0].id, "paid-last");
assert.deepEqual(rankRecommendedProfiles(all.slice(0, 3), "").map(p => p.id), ["0", "1", "2"]);
assert.equal(normalizeSearchSort(undefined, false), "recommended");
assert.equal(normalizeSearchSort("updated", false), "updated");
assert.equal(normalizeSearchSort("distance", true), "distance");
assert.equal(normalizeSearchSort("distance", false), "recommended");
const verified = {
  ...profile("verified", "Recovery House"),
  verificationTier: 2,
  ownershipStatus: "claimed" as const,
  organization: { ...paid, type: "aftercare_sober_living" as const, subscriptionPlan: "verified" }
};
const ids = (items: { id: string }[]) => items.map(p => p.id);
// A verified home wins within equal relevance even without a paid Stripe subscription.
const verifiedTrial = { ...verified, organization: { ...verified.organization, subscriptionStatus: "trialing" as const, stripeSubscriptionId: null, trialEndsAt: new Date("2099-01-01") } };
assert.deepEqual(ids(rankRecommendedProfiles([weakerPaid, verifiedTrial], "Recovery")), ["verified", "weaker"]);
assert.deepEqual(ids(rankRecommendedProfiles([verified, exact], "Recovery")), ["exact", "verified"]);
assert.deepEqual(ids(rankRecommendedProfiles([equalFree, verified], "")), ["verified", "free"]);
// Tier alone, an unclaimed listing, an expired trial, or a canceled subscription must not receive a verified boost.
for (const ineligible of [
  { ...verifiedTrial, verificationTier: 1 },
  { ...verifiedTrial, ownershipStatus: "unclaimed" as const },
  { ...verifiedTrial, organization: { ...verifiedTrial.organization, trialEndsAt: new Date("2000-01-01") } },
  { ...verified, organization: { ...verified.organization, subscriptionStatus: "canceled" as const } }
]) {
  assert.equal(rankRecommendedProfiles([{ ...weakerPaid, ownershipStatus: "claimed" }, ineligible], "")[0].id, "weaker");
}
assert.equal(rankRecommendedProfiles([...all, verifiedTrial], "").slice(0, 50)[0].id, "verified");
const secondVerified = { ...verifiedTrial, id: "second-verified" };
const unchanged = [verifiedTrial, secondVerified];
assert.deepEqual(ids(rankRecommendedProfiles(unchanged, "")), ["verified", "second-verified"]);
assert.deepEqual(ids(unchanged), ["verified", "second-verified"]);
const claimedBasic = { ...equalFree, id: "claimed-basic", ownershipStatus: "claimed" as const };
const unclaimedPaid = { ...weakerPaid, ownershipStatus: "unclaimed" as const };
const pendingPaid = { ...weakerPaid, id: "pending", ownershipStatus: "claim_pending" as const };
assert.deepEqual(ids(rankRecommendedProfiles([unclaimedPaid, claimedBasic], "Recovery")), ["claimed-basic", "weaker"]);
assert.deepEqual(ids(rankRecommendedProfiles([claimedBasic, verifiedTrial, unclaimedPaid], "")), ["verified", "claimed-basic", "weaker"]);
assert.deepEqual(ids(rankRecommendedProfiles([claimedBasic, exact], "Recovery")), ["exact", "claimed-basic"]);
assert.deepEqual(ids(rankRecommendedProfiles([pendingPaid, claimedBasic], "")), ["claimed-basic", "pending"]);
const claimedPaid = { ...weakerPaid, ownershipStatus: "claimed" as const };
assert.deepEqual(ids(rankRecommendedProfiles([claimedBasic, claimedPaid], "")), ["weaker", "claimed-basic"]);
assert.equal(rankRecommendedProfiles([...all, claimedBasic], "").slice(0, 50)[0].id, "claimed-basic");
const claimedTie = { ...claimedBasic, id: "claimed-tie" };
assert.deepEqual(ids(rankRecommendedProfiles([claimedBasic, claimedTie], "")), ["claimed-basic", "claimed-tie"]);
console.log("Search ranking tests passed: relevance, verified/claimed priority, pending claims, paid fallback, eligibility, pagination, stable ties, and explicit sort selection");
