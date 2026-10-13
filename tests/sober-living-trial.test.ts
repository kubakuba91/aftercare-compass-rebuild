import { strict as assert } from "node:assert";
import { OrganizationType, SubscriptionStatus, ProfileOwnershipStatus } from "@prisma/client";
import { canStartSoberLivingTrial, effectiveAftercarePlanKey, soberLivingTrialExpired } from "../lib/sober-living-trial";
import { canManageAftercareProfile, canReceiveDirectReferrals, canUseLiveAvailability, canUseOperationalAnalytics, canRequestVerification, canUseInAppMessaging, getAftercareManagerLimit, getAftercarePhotoLimit, getAftercareProfileLimit } from "../lib/feature-gates";

const base = { type: OrganizationType.aftercare_sober_living, subscriptionPlan: null, subscriptionStatus: null };
assert.equal(canStartSoberLivingTrial(base), true);
assert.equal(canStartSoberLivingTrial({ ...base, subscriptionPlan: "claimed_listing", subscriptionStatus: "active" }), true);
for (const change of [
  { type: "referent" }, { type: "aftercare_continued_care" }, { subscriptionPlan: "verified" },
  { subscriptionPlan: "professional" }, { subscriptionStatus: "past_due" },
  { stripeSubscriptionId: "paid" }, { trialStartedAt: new Date(0) }, { trialEndsAt: new Date(0) }
]) assert.equal(canStartSoberLivingTrial({ ...base, ...change }), false);

const trial = { ...base, subscriptionPlan: "professional", subscriptionStatus: SubscriptionStatus.trialing,
  trialStartedAt: new Date(), trialEndsAt: new Date(Date.now() + 86_400_000) };
const claimed = { ownershipStatus: ProfileOwnershipStatus.claimed };
assert.equal(soberLivingTrialExpired(trial, trial.trialEndsAt), true);
assert.equal(effectiveAftercarePlanKey(trial, trial.trialEndsAt), "claimed_listing");
assert.equal(getAftercareManagerLimit(trial), 3);
assert.equal(getAftercareProfileLimit(trial), 1);
assert.equal(getAftercarePhotoLimit(trial), 12);
for (const gate of [canReceiveDirectReferrals, canUseLiveAvailability, canUseOperationalAnalytics, canRequestVerification]) {
  assert.equal(gate(trial, claimed), true);
  assert.equal(gate({ ...trial, trialEndsAt: new Date(0) }, claimed), false);
  assert.equal(gate({ ...trial, trialEndsAt: null }, claimed), false);
  assert.equal(gate({ ...trial, trialEndsAt: new Date(0), subscriptionStatus: SubscriptionStatus.active }, claimed), true);
}
assert.equal(canUseInAppMessaging(trial), false); // Basic does not include messaging.
const expired = { ...trial, trialEndsAt: new Date(0) };
assert.equal(getAftercareManagerLimit(expired), 1);
assert.equal(getAftercarePhotoLimit(expired), 3);
assert.equal(canManageAftercareProfile(expired, claimed), true);
assert.equal(canStartSoberLivingTrial({ ...expired, subscriptionPlan: "claimed_listing", subscriptionStatus: "active" }), false);
assert.equal(canReceiveDirectReferrals(trial, { ownershipStatus: ProfileOwnershipStatus.unclaimed }), false);
console.log("Sober-living trial eligibility, exact expiry, missing dates, free fallback, paid upgrade and Basic limits passed.");
