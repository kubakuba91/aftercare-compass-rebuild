import assert from "node:assert/strict";
import {
  centralPennsylvania,
  crisisLinks,
  nationalLinks,
  otherStates,
  pennsylvaniaGroups
} from "../lib/community-resources/content";
import { federalOwnerFunding, stateOwnerFunding } from "../lib/recovery-housing/funding";
import { standardsLinks } from "../lib/recovery-housing/general";
import { stateResources } from "../lib/recovery-housing/states";
import type { ResourceLink } from "../lib/recovery-housing/types";
import { filterResources, normalizeResourceTab, resourceCatalog, resourceCategories } from "../lib/resources/catalog";

const urls = new Set(resourceCatalog.map((entry) => entry.url));

function expectLink(link: ResourceLink) {
  assert.equal(urls.has(link.href), true, `missing ${link.title}: ${link.href}`);
}

for (const link of [...crisisLinks, ...nationalLinks, ...federalOwnerFunding, ...standardsLinks, ...stateOwnerFunding]) {
  expectLink(link);
}
for (const group of pennsylvaniaGroups) {
  for (const link of group.links) expectLink(link);
}
for (const place of centralPennsylvania) {
  for (const link of place.links) expectLink(link);
}
for (const state of otherStates) {
  for (const group of state.groups) {
    for (const link of group.links) expectLink(link);
  }
  for (const place of state.places ?? []) {
    for (const link of place.links) expectLink(link);
  }
}
for (const state of stateResources) {
  if (state.body.href) assert.equal(urls.has(state.body.href), true, state.body.name);
  for (const link of state.links) expectLink(link);
  for (const link of state.local?.links ?? []) expectLink(link);
  if (state.narrAffiliate) expectLink(state.narrAffiliate);
  for (const link of state.fundingLinks ?? []) expectLink(link);
}

const paHousing = filterResources(resourceCatalog, { state: "PA", category: "housing", query: "" });
assert.ok(paHousing.some((entry) => entry.title === "PHFA renter assistance"));
assert.equal(paHousing.some((entry) => entry.title === "PA 211"), false);

const paLicensing = filterResources(resourceCatalog, { state: "PA", category: "licensing", query: "DDAP" });
assert.ok(paLicensing.some((entry) => entry.url.includes("licensed-recovery-house")));

const shelterInPa = filterResources(resourceCatalog, { state: "PA", category: "shelter", query: "" });
assert.ok(shelterInPa.some((entry) => entry.title === "HUD Find Shelter" && entry.state === null));
assert.ok(shelterInPa.every((entry) => entry.state === "PA" || entry.state === null));
const firstNational = shelterInPa.findIndex((entry) => entry.state === null);
assert.ok(shelterInPa.slice(0, firstNational).every((entry) => entry.state === "PA"));

const maEmployment = filterResources(resourceCatalog, { state: "MA", category: "employment", query: "" });
assert.equal(maEmployment.length, 0);

const paRecovery = filterResources(resourceCatalog, { state: "PA", category: "recovery", query: "" });
assert.ok(paRecovery.some((entry) => entry.title === "Eastern Pennsylvania A.A. Area 59" && entry.state === "PA"));
assert.ok(paRecovery.some((entry) => entry.title === "Find A.A. near you" && entry.state === null));
const recoveryNational = paRecovery.findIndex((entry) => entry.state === null);
assert.ok(paRecovery.slice(0, recoveryNational).every((entry) => entry.state === "PA"));

const paFamily = filterResources(resourceCatalog, { state: "PA", category: "family", query: "" });
assert.ok(paFamily.some((entry) => entry.title === "Child Care Works"));
assert.ok(paFamily.some((entry) => entry.title === "988 Suicide & Crisis Lifeline" && entry.state === null));

const paVeterans = filterResources(resourceCatalog, { state: "PA", category: "veterans", query: "" });
assert.ok(paVeterans.some((entry) => entry.title === "County directors of veterans affairs"));
assert.ok(paVeterans.some((entry) => entry.title === "Veterans Crisis Line" && entry.state === null));
assert.equal(paVeterans.some((entry) => /treatment locator|findtreatment/i.test(entry.url + entry.title)), false);

assert.equal(resourceCatalog.some((entry) => /findtreatment|locator\.crgroups|sud/i.test(entry.url)), false);

assert.equal(resourceCategories.find((category) => category.id === "licensing")?.label, "Licensing");
assert.equal(resourceCategories.some((category) => category.id === "funding" && category.label === "Funding"), true);
assert.equal(normalizeResourceTab("licensing-funding"), "licensing");
assert.equal(normalizeResourceTab("funding"), "funding");

const paFunding = filterResources(resourceCatalog, { state: "PA", category: "funding", query: "" });
assert.ok(paFunding.some((entry) => entry.url.includes("hudexchange.info/programs/rhp") && entry.state === null));
assert.ok(paFunding.some((entry) => entry.title === "DDAP Funding Opportunities" && entry.state === "PA"));
assert.ok(paFunding.some((entry) => entry.title === "Lancaster SCA Recovery House Scholarships"));
assert.equal(paFunding.some((entry) => entry.category !== "funding"), false);
assert.equal(
  filterResources(resourceCatalog, { state: "PA", category: "licensing", query: "" }).some((entry) => entry.url.includes("funding-opportunities")),
  false
);
