import assert from "node:assert/strict";
import { test } from "node:test";
import { profileMetadata, profileSeo, profileStructuredData, serializeJsonLd, type SeoProfile } from "../lib/profile-seo";

const profile: SeoProfile = {
  slug: "example-house", programName: "Example House", type: "sober_living",
  publicCity: "Boston", publicState: "MA", telehealthMode: null, statesServed: [],
  description: "<p>A supportive recovery residence.</p>", levelsOfCare: [], admissionsContactPhone: "555-555-0100"
};

test("profile metadata is unique, plain text, and uses a clean public canonical", () => {
  const seo = profileSeo(profile);
  assert.match(seo.title, /Example House — Sober Living in Boston, MA/);
  assert.match(seo.canonical, /^https:\/\//);
  assert.ok(seo.canonical.endsWith("/profiles/example-house"));
  assert.equal(new URL(seo.canonical).search, "");
  assert.ok(seo.description.includes("A supportive recovery residence."));
  assert.ok(seo.description.length <= 160);
  assert.ok(!seo.description.includes("<p>"));
  assert.deepEqual(profileMetadata(profile).alternates, { canonical: seo.canonical });
  assert.notEqual(profileSeo({ ...profile, programName: "Another House" }).title, seo.title);
});

test("virtual profiles describe service coverage rather than a physical location", () => {
  const virtual = { ...profile, type: "continued_care" as const, telehealthMode: "Virtual only", statesServed: ["MA", "NH"] };
  const seo = profileSeo(virtual);
  assert.match(seo.title, /Continued Care Virtual in MA, NH/);
  assert.ok(!seo.title.includes("Boston"));
  const schema = JSON.stringify(profileStructuredData(virtual));
  assert.ok(schema.includes("AdministrativeArea"));
  assert.ok(!schema.includes("Boston"));
});

test("schema excludes private locations, credentials, and unsupported ratings", () => {
  const schema = profileStructuredData({ ...profile, streetAddress: "123 Private Street", city: "Private City", latitude: "42.123456" } as SeoProfile);
  const text = JSON.stringify(schema);
  for (const secret of ["123 Private Street", "Private City", "42.123456", "streetAddress", "aggregateRating", "MedicalClinic"]) assert.ok(!text.includes(secret));
  assert.ok(text.includes("Boston"));
  assert.ok(text.includes("BreadcrumbList"));
  assert.ok(text.includes(profile.admissionsContactPhone!));
});

test("JSON-LD cannot terminate its script element through provider text", () => {
  const serialized = serializeJsonLd(profileStructuredData({ ...profile, programName: "</script><script>alert(1)</script>" }));
  assert.ok(!serialized.includes("<"));
  assert.equal(JSON.parse(serialized)["@graph"][1].name, "</script><script>alert(1)</script>");
});

test("sparse and long profiles still receive concise metadata", () => {
  const sparse = profileSeo({ ...profile, publicCity: "", publicState: "", description: null });
  assert.ok(sparse.description.includes("contact information"));
  assert.ok(!sparse.title.includes("undefined"));
  const long = profileSeo({ ...profile, description: "Supportive recovery services. ".repeat(40) });
  assert.ok(long.description.length <= 160);
});
