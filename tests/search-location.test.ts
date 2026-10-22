import assert from "node:assert/strict";
import { parseSearchLocation, searchLocationWhere, removeSearchStateHref, stateAliases } from "../lib/search-location";

for (const [name, code] of Object.entries(stateAliases)) {
  for (const input of [name, code, code.toLowerCase(), `  ${code}  `]) {
    assert.equal(parseSearchLocation(input)?.state.code, code);
    assert.equal(parseSearchLocation(input)?.city, "");
  }
}
for (const input of ["Lancaster, PA", "Lancaster pa", "Lancaster PA", "Lancaster, Pennsylvania"]) {
  assert.equal(parseSearchLocation(input)?.state.code, "PA");
  assert.equal(parseSearchLocation(input)?.city, "Lancaster");
}
for (const input of ["patients", "Pathway Recovery", "Recovery in", "Help me", "Lancaster ZZ", "", "Tampa"]) {
  assert.equal(parseSearchLocation(input), null, input);
}
assert.equal(parseSearchLocation("Washington, DC")?.state.coverage, "Washington, DC");
assert.equal(parseSearchLocation("New York")?.state.code, "NY");

// Evaluate the generated predicates against representative physical and virtual
// listings to catch accidental broad OR conditions and headquarters matches.
function matches(row: Record<string, unknown>, filter: any): boolean {
  return Object.entries(filter).every(([key, value]: [string, any]) => {
    if (key === "OR") return value.some((part: any) => matches(row, part));
    if (key === "AND") return value.every((part: any) => matches(row, part));
    if (value === null || typeof value !== "object") return row[key] === value;
    if ("not" in value) return row[key] !== null && row[key] !== value.not;
    if ("has" in value) return (row[key] as string[]).includes(value.has);
    const actual = String(row[key] || "").toLowerCase();
    return "equals" in value ? actual === value.equals.toLowerCase() : actual.includes(value.contains.toLowerCase());
  });
}
const base = { type: "continued_care", telehealthMode: null, publicCity: "Lancaster", publicState: "PA", statesServed: [], programName: "Patients Program" };
const where = searchLocationWhere(parseSearchLocation("PA")!);
assert.ok(matches(base, where));
assert.ok(matches({ ...base, publicState: "pennsylvania" }, where));
assert.ok(!matches({ ...base, publicState: "CA" }, where));
assert.ok(!matches({ ...base, publicState: "PA-other" }, where));
assert.ok(matches({ ...base, telehealthMode: "Virtual only", publicState: "CA", statesServed: ["Pennsylvania"] }, where));
assert.ok(!matches({ ...base, telehealthMode: "Virtual only", statesServed: ["California"] }, where));
const cityWhere = searchLocationWhere(parseSearchLocation("Lancaster, PA")!);
assert.ok(!matches({ ...base, publicCity: "Pittsburgh" }, cityWhere));
assert.ok(!matches({ ...base, publicState: "CA" }, cityWhere));
assert.ok(matches({ ...base, telehealthMode: "Virtual only", publicCity: "Austin", publicState: "TX", statesServed: ["Pennsylvania"] }, cityWhere));
const removed = new URL(removeSearchStateHref({ q: "Lancaster, PA", type: "continued_care", mat: ["A", "B"], page: "3", selected: "old", radius: "50" }, parseSearchLocation("Lancaster, PA")!), "https://example.com");
assert.equal(removed.searchParams.get("q"), "Lancaster");
assert.deepEqual(removed.searchParams.getAll("mat"), ["A", "B"]);
assert.equal(removed.searchParams.get("type"), "continued_care");
for (const key of ["page", "selected", "radius"]) assert.ok(!removed.searchParams.has(key));
assert.ok(!new URL(removeSearchStateHref({ q: "PA" }, parseSearchLocation("PA")!), "https://example.com").searchParams.has("q"));
console.log("State aliases, location parsing, physical/virtual matching, ordinary text and filter removal passed.");
