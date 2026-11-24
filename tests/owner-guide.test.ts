import assert from "node:assert/strict";
import { isOwnerGuideTab, ownerGuideHref, ownerGuideTabs } from "../lib/recovery-housing/owner-guide";

assert.deepEqual(
  ownerGuideTabs.map((tab) => tab.id),
  ["all", "licensing", "standards", "zoning", "funding", "templates", "faq"]
);
assert.equal(isOwnerGuideTab("licensing"), true);
assert.equal(isOwnerGuideTab("housing"), false);
assert.equal(ownerGuideHref("PA", "licensing", ""), "/resources/recovery-house-owners?state=PA&tab=licensing");
assert.equal(ownerGuideHref("all", "all", "zoning"), "/resources/recovery-house-owners?q=zoning");
assert.equal(ownerGuideHref("all", "faq", ""), "/resources/recovery-house-owners?tab=faq");
