import assert from "node:assert/strict";
import { filterResources, resourceCatalog } from "../lib/resources/catalog";
import { contentMatches, interpretSearch } from "../lib/resources/smart-search";

const philadelphia = interpretSearch("Philadelphia");
assert.equal(philadelphia.place?.state, "PA");
assert.equal(philadelphia.place?.city, "Philadelphia");
assert.equal(philadelphia.place?.county, "Philadelphia County");

assert.equal(interpretSearch("Philly").place?.city, "Philadelphia");
assert.equal(interpretSearch("philadelpha").place?.city, "Philadelphia");
assert.equal(interpretSearch("Pgh").place?.city, "Pittsburgh");
assert.equal(interpretSearch("Hbg").place?.city, "Harrisburg");
assert.equal(interpretSearch("NYC").place?.state, "NY");
assert.equal(interpretSearch("PA").place?.state, "PA");
assert.equal(interpretSearch("Pennsylvania").place?.state, "PA");
assert.equal(interpretSearch("delaware county").place?.state, "PA");
assert.equal(interpretSearch("Delaware").place?.state, "DE");

const phillyResults = filterResources(resourceCatalog, { state: "all", category: "all", query: "Philadelphia" });
assert.ok(phillyResults.length > 10);
assert.ok(phillyResults.some((entry) => entry.title.includes("SEPIA")));
assert.ok(phillyResults.some((entry) => entry.state === null));
assert.ok(phillyResults.every((entry) => entry.state === "PA" || entry.state === null));
const sepia = phillyResults.findIndex((entry) => entry.title.includes("SEPIA"));
const genericPa = phillyResults.findIndex((entry) => entry.state === "PA" && !/philadelphia|philly|bucks|chester|montgomery|delaware county/i.test(`${entry.title} ${entry.description} ${entry.area} ${(entry.tags ?? []).join(" ")}`));
assert.ok(sepia >= 0 && genericPa >= 0 && sepia < genericPa);

const phillyTypo = filterResources(resourceCatalog, { state: "all", category: "all", query: "Philadelpha" });
assert.ok(phillyTypo.some((entry) => entry.state === "PA"));

const scholarship = filterResources(resourceCatalog, { state: "all", category: "funding", query: "lancaster scholarship" });
assert.ok(scholarship.some((entry) => entry.title.includes("Lancaster")));

assert.equal(contentMatches("Zoning is local.", "Philadelphia", { national: true }), true);
assert.equal(contentMatches("New Jersey licensing office", "Philadelphia", { state: "NJ" }), false);
assert.equal(contentMatches("Pennsylvania recovery house license", "Philadelphia", { state: "PA" }), true);

const none = filterResources(resourceCatalog, { state: "all", category: "all", query: "zzzzqqqq" });
assert.equal(none.length, 0);
