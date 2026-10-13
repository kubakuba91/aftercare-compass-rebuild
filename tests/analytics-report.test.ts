import { strict as assert } from "node:assert";
import { analyticsRange, dailyActivity, normalizeAnalytics, type AnalyticsReport } from "../lib/analytics-report";

assert.equal(analyticsRange("90"), 90);
assert.equal(analyticsRange(["7", "90"]), 7);
assert.equal(analyticsRange("365"), 30);
assert.equal(analyticsRange(), 30);

const report: AnalyticsReport = {
  metadata: { timeZone: "America/New_York" },
  rows: [{ dimensionValues: [{ value: "20260928" }], metricValues: [{ value: "12" }] }]
};
// At 01:00 UTC it is still September 29 in the property's time zone.
const daily = dailyActivity(report, 7, new Date("2026-09-30T01:00:00Z"));
assert.equal(daily.length, 7);
assert.deepEqual(daily[0], { date: "2026-09-22", views: 0 });
assert.deepEqual(daily[6], { date: "2026-09-28", views: 12 });
assert.equal(dailyActivity({ metadata: { timeZone: "America/New_York" } }, 7, new Date("2026-03-10T12:00:00Z"))[0].date, "2026-03-03");
const data = normalizeAnalytics([
  { rows: [{ metricValues: [{ value: "10" }, { value: "20" }, { value: "30" }, { value: "0.65" }] }] },
  report, {}, {}, {}, { metadata: { subjectToThresholding: true } }
], 7, new Date("2026-09-30T01:00:00Z"));
assert.equal(data.totals.engagementRate, 0.65);
assert.equal(data.totals.users, 10);
assert.deepEqual(data.pages, []);
assert.equal(data.limited, true);
assert.equal(normalizeAnalytics([{}, {}, {}, {}, {}, {}], 30).totals.views, 0);
assert.throws(() => normalizeAnalytics([{}], 30), /Incomplete/);
console.log("Analytics range, time-zone, daylight-saving, empty-report, and metric checks passed.");
