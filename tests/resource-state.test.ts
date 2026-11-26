import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeOwnerGuideTab } from "../lib/recovery-housing/owner-guide";
import { normalizeResourceTab } from "../lib/resources/catalog";
import {
  resourceCanonicalPath,
  resourceQueryHref,
  resourceStateCookie,
  resolveResourceState
} from "../lib/resources/state-choice";

const known = ["PA", "MD", "DE", "NJ"];

test("URL state wins over a saved pick and geo", () => {
  assert.deepEqual(
    resolveResourceState({ urlState: "md", savedState: "PA", country: "US", region: "NJ", knownStates: known }),
    { state: "MD", source: "url" }
  );
});

test("an explicit all in the URL wins over a saved pick and geo", () => {
  assert.deepEqual(
    resolveResourceState({ urlState: "all", savedState: "PA", country: "US", region: "NJ", knownStates: known }),
    { state: "all", source: "url" }
  );
});

test("a saved pick wins over geo when the URL has no usable state", () => {
  assert.deepEqual(
    resolveResourceState({ urlState: "ZZ", savedState: "de", country: "US", region: "NJ", knownStates: known }),
    { state: "DE", source: "saved" }
  );
  assert.deepEqual(
    resolveResourceState({ urlState: null, savedState: "all", country: "US", region: "PA", knownStates: known }),
    { state: "all", source: "saved" }
  );
});

test("geo selects a known US state only after URL and saved pick miss", () => {
  assert.deepEqual(
    resolveResourceState({ urlState: "", savedState: "nope", country: "us", region: "us-pa", knownStates: known }),
    { state: "PA", source: "geo" }
  );
});

test("geo falls back to the default outside the US or when the state is not listed", () => {
  assert.deepEqual(
    resolveResourceState({ country: "CA", region: "ON", knownStates: known }),
    { state: "all", source: "default" }
  );
  assert.deepEqual(
    resolveResourceState({ country: "US", region: "CA", knownStates: known }),
    { state: "all", source: "default" }
  );
  assert.deepEqual(
    resolveResourceState({ country: "US", region: null, knownStates: known }),
    { state: "all", source: "default" }
  );
  assert.deepEqual(resolveResourceState({ knownStates: known }), { state: "all", source: "default" });
});

test("canonical URLs follow the request, not geo or a saved pick", () => {
  assert.equal(resourceCanonicalPath("/resources", {}, known, normalizeResourceTab), "/resources");
  assert.equal(
    resourceCanonicalPath("/resources", { state: "pa", tab: "housing" }, known, normalizeResourceTab),
    "/resources?state=PA&tab=housing"
  );
  assert.equal(resourceCanonicalPath("/resources", { state: "all" }, known, normalizeResourceTab), "/resources");
  assert.equal(resourceCanonicalPath("/resources", { state: "ZZ" }, known, normalizeResourceTab), "/resources");
  assert.equal(
    resourceCanonicalPath("/resources/recovery-house-owners", { state: "NJ", tab: "licensing-funding", q: "  grant  " }, known, normalizeOwnerGuideTab),
    "/resources/recovery-house-owners?state=NJ&tab=licensing&q=grant"
  );
});

test("an explicit all stays in the URL so the next request does not snap back to geo", () => {
  assert.equal(resourceQueryHref("/resources", { state: "all", explicitAll: true }), "/resources?state=all");
  assert.equal(resourceQueryHref("/resources", { state: "PA", tab: "food" }), "/resources?state=PA&tab=food");
});

test("the saved-state cookie stores only the state code", () => {
  const cookie = resourceStateCookie("pa", true);
  assert.equal(cookie, "ac_resource_state=PA; Path=/resources; Max-Age=31536000; SameSite=Lax; Secure");
  assert.equal(cookie.includes("ip") || cookie.includes("lat"), false);
  assert.equal(resourceStateCookie("all"), "ac_resource_state=all; Path=/resources; Max-Age=31536000; SameSite=Lax");
});
