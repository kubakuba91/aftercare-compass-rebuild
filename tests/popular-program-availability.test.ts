import assert from "node:assert/strict";
import { popularProgramAvailability } from "../lib/popular-program-availability";

const profile = { type: "continued_care" as const, ownershipStatus: "unclaimed" as const, bedsAvailable: null, acceptingNewPatients: true, organization: null };
assert.deepEqual(popularProgramAvailability(profile), { isAvailable: true, availabilityLabel: "Accepting patients" });
for (const acceptingNewPatients of [false, null]) {
  assert.deepEqual(popularProgramAvailability({ ...profile, acceptingNewPatients }), { isAvailable: false, availabilityLabel: "Call for availability" });
}
const home = { ...profile, type: "sober_living" as const, bedsAvailable: 2 };
assert.equal(popularProgramAvailability(home).isAvailable, false);
const claimed = { ...home, ownershipStatus: "claimed" as const, organization: { type: "aftercare_sober_living" as const, subscriptionPlan: "professional", subscriptionStatus: "active" as const } };
assert.deepEqual(popularProgramAvailability(claimed), { isAvailable: true, availabilityLabel: "2 beds open" });
assert.equal(popularProgramAvailability({ ...claimed, bedsAvailable: 1 }).availabilityLabel, "1 bed open");
for (const bedsAvailable of [0, null]) assert.equal(popularProgramAvailability({ ...claimed, bedsAvailable }).isAvailable, false);
assert.equal(popularProgramAvailability({ ...claimed, organization: { ...claimed.organization, subscriptionStatus: "canceled" } }).isAvailable, false);
console.log("Homepage availability: continued-care acceptance independent of housing gates; sober-living ownership, subscription and bed-count restrictions preserved.");
