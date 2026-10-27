import assert from "node:assert/strict";
import { hasActivePaidSubscription, rankRecommendedProfiles } from "../lib/search-ranking";
import { normalizeSearchSort } from "../lib/search-sort";

const paid = { subscriptionStatus: "active", subscriptionPlan: "professional", stripeSubscriptionId: "sub_paid" };
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
console.log("Search ranking tests passed");
