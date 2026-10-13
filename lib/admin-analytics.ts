import "server-only";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { normalizeAnalytics, type AnalyticsData, type AnalyticsRange } from "@/lib/analytics-report";

export type AnalyticsState =
  | { status: "setup" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AnalyticsData };

const cachedReports = unstable_cache(async (propertyId: string, email: string, days: AnalyticsRange) => {
  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: email,
      private_key: process.env.GA4_PRIVATE_KEY!.replace(/\\n/g, "\n")
    },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"]
  });
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "yesterday" }];
  const detail = (dimension: string, metric: string, limit: number) => ({
    dateRanges,
    dimensions: [{ name: dimension }],
    metrics: [{ name: metric }],
    orderBys: [{ metric: { metricName: metric }, desc: true }],
    limit
  });

  try {
    // Google accepts at most five reports per batch.
    const [[main], [audience]] = await Promise.all([
      client.batchRunReports({
        property: `properties/${propertyId}`,
        requests: [
          { dateRanges, metrics: ["activeUsers", "sessions", "screenPageViews", "engagementRate"].map(name => ({ name })) },
          { ...detail("date", "screenPageViews", days), orderBys: [{ dimension: { dimensionName: "date" } }] },
          detail("pagePath", "screenPageViews", 10),
          detail("sessionDefaultChannelGroup", "sessions", 10),
          detail("deviceCategory", "activeUsers", 10)
        ]
      }, { timeout: 15_000, retry: null }),
      client.batchRunReports({
        property: `properties/${propertyId}`,
        requests: [detail("country", "activeUsers", 10)]
      }, { timeout: 15_000, retry: null })
    ]);
    return normalizeAnalytics([...(main.reports ?? []), ...(audience.reports ?? [])], days);
  } finally {
    await client.close();
  }
}, ["admin-ga4-reports-v1"], { revalidate: 300 });

export async function getAdminAnalytics(days: AnalyticsRange): Promise<AnalyticsState> {
  // Authorize before reading the shared report cache.
  const user = await getProtectedAppUser("/dashboard/admin?tab=analytics");
  if (user.role !== Role.system_admin) redirect("/dashboard");

  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const email = process.env.GA4_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GA4_PRIVATE_KEY;
  if (!propertyId || !email || !privateKey) return { status: "setup" };
  if (!/^\d+$/.test(propertyId)) {
    return { status: "error", message: "The Analytics connection needs a numeric GA4 Property ID. Check the reporting configuration." };
  }
  try {
    return { status: "ready", data: await cachedReports(propertyId, email, days) };
  } catch (error) {
    const code = (error as { code?: number })?.code;
    // Do not expose Google's raw errors, credentials, or request details.
    return {
      status: "error",
      message: code === 7 || code === 16
        ? "Google Analytics access was denied. Check the service account credentials, property access, and that the Analytics Data API is enabled."
        : code === 8
          ? "Google Analytics is temporarily limiting requests. Please try again in a few minutes."
          : "Google Analytics reports are temporarily unavailable. Try again shortly; if this continues, check the reporting connection."
    };
  }
}
