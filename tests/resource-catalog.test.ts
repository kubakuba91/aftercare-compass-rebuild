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
import { filterResources, normalizeResourceTab, resourceCatalog, resourceCategories, showInOwnerGuide } from "../lib/resources/catalog";

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
assert.ok(paVeterans.some((entry) => entry.title === "VA health care" && entry.url === "https://www.va.gov/health-care/how-to-apply/"));
assert.ok(paVeterans.some((entry) => entry.title === "VA homeless help" && entry.url === "https://www.va.gov/resources/homeless-help/"));
assert.ok(paVeterans.some((entry) => entry.title === "World Trade Center Health Program" && entry.section === "first-responders"));
assert.ok(paVeterans.some((entry) => entry.title === "FealGood Foundation" && entry.section === "first-responders"));
assert.equal(paVeterans.some((entry) => entry.section === "first-responders" && entry.title === "County directors of veterans affairs"), false);
assert.equal(paVeterans.some((entry) => /treatment locator|findtreatment/i.test(entry.url + entry.title)), false);

assert.equal(resourceCatalog.some((entry) => /findtreatment|locator\.crgroups|sud/i.test(entry.url)), false);

assert.equal(resourceCategories.find((category) => category.id === "licensing")?.label, "Licensing");
assert.equal(resourceCategories.some((category) => category.id === "funding" && category.label === "Funding"), true);
assert.equal(resourceCategories.find((category) => category.id === "veterans")?.label, "Veterans & First Responders");
assert.equal(resourceCategories.some((category) => (category.id as string) === "first-responders"), false);
assert.equal(normalizeResourceTab("licensing-funding"), "licensing");
assert.equal(normalizeResourceTab("funding"), "funding");
assert.equal(normalizeResourceTab("veterans"), "veterans");

const paFunding = filterResources(resourceCatalog, { state: "PA", category: "funding", query: "" });
assert.ok(paFunding.some((entry) => entry.url.includes("hudexchange.info/programs/rhp") && entry.state === null));
assert.ok(paFunding.some((entry) => entry.title === "DDAP Funding Opportunities" && entry.state === "PA"));
assert.ok(paFunding.some((entry) => entry.title === "Lancaster SCA Recovery House Scholarships"));
assert.equal(paFunding.some((entry) => entry.category !== "funding"), false);
assert.equal(
  filterResources(resourceCatalog, { state: "PA", category: "licensing", query: "" }).some((entry) => entry.url.includes("funding-opportunities")),
  false
);

const bridge = resourceCatalog.find((entry) => entry.title === "PA Bridge to Recovery Housing");
const vcf = resourceCatalog.find((entry) => entry.title === "September 11th Victim Compensation Fund" && entry.category === "funding");
const fealgood = resourceCatalog.find((entry) => entry.title === "FealGood Foundation" && entry.category === "funding");
assert.equal(bridge?.slug, "pa-bridge-to-recovery-housing");
assert.equal(bridge?.state, "PA");
assert.equal(vcf?.slug, "september-11th-victim-compensation-fund");
assert.equal(fealgood?.slug, "fealgood-foundation");
assert.equal(showInOwnerGuide(bridge!), true);
assert.equal(showInOwnerGuide(resourceCatalog.find((entry) => entry.title.startsWith("Maryland RecoveryNet"))!), true);
assert.equal(showInOwnerGuide(vcf!), false);
assert.equal(showInOwnerGuide(fealgood!), false);
assert.equal(showInOwnerGuide(resourceCatalog.find((entry) => entry.title.startsWith("Social Security Disability"))!), false);

const fundingTitles = filterResources(resourceCatalog, { state: "all", category: "funding", query: "" }).map((entry) => entry.title);
for (const title of [
  "PA Bridge to Recovery Housing",
  "Maryland RecoveryNet (MDRN) recovery housing",
  "September 11th Victim Compensation Fund",
  "FealGood Foundation",
  "Social Security Disability Insurance (SSDI)"
]) {
  assert.ok(fundingTitles.includes(title), title);
}

const nineEleven = filterResources(resourceCatalog, { state: "all", category: "all", query: "9/11" });
for (const title of ["September 11th Victim Compensation Fund", "FealGood Foundation", "World Trade Center Health Program"]) {
  assert.ok(nineEleven.some((entry) => entry.title === title), title);
}
assert.equal(nineEleven.some((entry) => entry.title === "Child Care Works"), false);

const firefighters = filterResources(resourceCatalog, { state: "all", category: "all", query: "firefighter" });
for (const title of ["FDNY Counseling Service Unit", "IAFF Center of Excellence for Behavioral Health", "NVFC Share the Load"]) {
  assert.ok(firefighters.some((entry) => entry.title === title), title);
}

const pennsylvania = filterResources(resourceCatalog, { state: "all", category: "all", query: "Pennsylvania" });
assert.ok(pennsylvania.some((entry) => entry.title === "PA Bridge to Recovery Housing"));
assert.ok(pennsylvania.some((entry) => entry.title === "September 11th Victim Compensation Fund"));

const slugs = new Map<string, Set<string>>();
for (const entry of resourceCatalog) {
  const used = slugs.get(entry.category) ?? new Set<string>();
  assert.equal(used.has(entry.slug), false, `${entry.category} duplicate slug ${entry.slug}`);
  used.add(entry.slug);
  slugs.set(entry.category, used);
}
