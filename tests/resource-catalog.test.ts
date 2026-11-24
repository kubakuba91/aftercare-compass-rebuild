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
import { filterResources, resourceCatalog } from "../lib/resources/catalog";

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
assert.equal(shelterInPa.length, 0);
const shelterAll = filterResources(resourceCatalog, { state: "all", category: "shelter", query: "" });
assert.ok(shelterAll.some((entry) => entry.title === "HUD Find Shelter"));
