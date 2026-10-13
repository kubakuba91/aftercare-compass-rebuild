export const analyticsRanges = [7, 30, 90] as const;
export type AnalyticsRange = (typeof analyticsRanges)[number];

export function analyticsRange(value?: string | string[]): AnalyticsRange {
  const days = Number(Array.isArray(value) ? value[0] : value);
  return analyticsRanges.includes(days as AnalyticsRange) ? days as AnalyticsRange : 30;
}

export type AnalyticsReport = {
  rows?: { dimensionValues?: { value?: string | null }[] | null; metricValues?: { value?: string | null }[] | null }[] | null;
  metadata?: { timeZone?: string | null; subjectToThresholding?: boolean | null; dataLossFromOtherRow?: boolean | null } | null;
};

export function metricValue(value?: string | null) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

export function reportRows(report: AnalyticsReport) {
  return (report.rows ?? []).map(row => ({
    label: row.dimensionValues?.[0]?.value || "(not set)",
    value: metricValue(row.metricValues?.[0]?.value)
  }));
}

export function dailyActivity(report: AnalyticsReport, days: AnalyticsRange, now = new Date()) {
  const timeZone = report.metadata?.timeZone || "UTC";
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(value => value.type === type)!.value;
  const today = Date.UTC(Number(part("year")), Number(part("month")) - 1, Number(part("day")));
  const values = new Map(reportRows(report).map(row => [row.label, row.value]));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today - (days - index) * 86_400_000).toISOString().slice(0, 10);
    return { date, views: values.get(date.replaceAll("-", "")) ?? 0 };
  });
}

export function normalizeAnalytics(reports: AnalyticsReport[], days: AnalyticsRange, now = new Date()) {
  if (reports.length !== 6) throw new Error("Incomplete analytics response");
  const metrics = reports[0].rows?.[0]?.metricValues;
  return {
    totals: {
      users: metricValue(metrics?.[0]?.value),
      sessions: metricValue(metrics?.[1]?.value),
      views: metricValue(metrics?.[2]?.value),
      engagementRate: metricValue(metrics?.[3]?.value)
    },
    daily: dailyActivity(reports[1], days, now),
    pages: reportRows(reports[2]),
    sources: reportRows(reports[3]),
    devices: reportRows(reports[4]),
    countries: reportRows(reports[5]),
    timeZone: reports[1].metadata?.timeZone || "UTC",
    limited: reports.some(report => report.metadata?.subjectToThresholding || report.metadata?.dataLossFromOtherRow),
    updatedAt: now.toISOString()
  };
}

export type AnalyticsData = ReturnType<typeof normalizeAnalytics>;
