import Link from "next/link";
import { BarChart3, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAdminAnalytics } from "@/lib/admin-analytics";
import { analyticsRanges, type AnalyticsRange } from "@/lib/analytics-report";

const number = new Intl.NumberFormat("en-US");

function ReportTable({ title, label, metric, rows }: {
  title: string; label: string; metric: string; rows: { label: string; value: number }[];
}) {
  return (
    <Card className="min-w-0">
      <h3 className="text-lg font-semibold">{title}</h3>
      {rows.length ? (
        <table className="mt-4 w-full table-fixed text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr><th scope="col" className="pb-3 font-medium">{label}</th><th scope="col" className="w-28 pb-3 text-right font-medium">{metric}</th></tr>
          </thead>
          <tbody>{rows.map(row => (
            <tr key={row.label} className="border-b border-border last:border-0">
              <td className="break-words py-3 pr-3">{row.label}</td>
              <td className="py-3 text-right tabular-nums">{number.format(row.value)}</td>
            </tr>
          ))}</tbody>
        </table>
      ) : <p className="mt-4 text-sm text-muted-foreground">No data reported for this period.</p>}
    </Card>
  );
}

export async function AnalyticsPanel({ days }: { days: AnalyticsRange }) {
  const state = await getAdminAnalytics(days);
  const data = state.status === "ready" ? state.data : null;
  const maximum = Math.max(1, ...(data?.daily.map(day => day.views) ?? []));
  return (
    <div className="mt-6 grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><BarChart3 size={24} /> Website analytics</h2>
          <p className="mt-2 text-sm text-muted-foreground">Last {days} complete days through yesterday. Reports refresh every five minutes.</p>
        </div>
        <nav aria-label="Analytics date range" className="flex gap-2">
          {analyticsRanges.map(range => <Link key={range} aria-current={days === range ? "page" : undefined} className={`focus-ring rounded-md border px-4 py-2 text-sm font-semibold ${days === range ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white"}`} href={`/dashboard/admin?tab=analytics&days=${range}`}>{range} days</Link>)}
        </nav>
      </div>

      {state.status === "setup" ? (
        <Card>
          <h3 className="text-lg font-semibold">Connect Google Analytics reporting</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">The website tracking tag is installed. To display reports here, connect a Google service account with Viewer access to the Aftercare Compass Analytics property.</p>
          <p className="mt-3 text-sm text-muted-foreground">Your site administrator can complete the reporting connection in the hosting configuration. No visitor reports are available here until that connection is complete.</p>
          <a className="focus-ring mt-4 inline-flex items-center gap-2 font-semibold text-primary underline" href="https://analytics.google.com/analytics/web/#/p556225585" target="_blank" rel="noreferrer">Open Google Analytics <ExternalLink size={16} /></a>
        </Card>
      ) : null}
      {state.status === "error" ? <Card><h3 className="text-lg font-semibold">Reports unavailable</h3><p role="status" className="mt-2 text-sm text-muted-foreground">{state.message}</p><a href={`/dashboard/admin?tab=analytics&days=${days}`} className="focus-ring mt-4 inline-block font-semibold text-primary underline">Try again</a></Card> : null}

      {data ? <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Active users", number.format(data.totals.users)],
            ["Sessions", number.format(data.totals.sessions)],
            ["Page views", number.format(data.totals.views)],
            ["Engagement rate", `${(data.totals.engagementRate * 100).toFixed(1)}%`]
          ].map(([label, value]) => <Card key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p></Card>)}
        </div>
        {data.totals.views === 0 ? <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Google Analytics has not reported any page views for this period yet. Recently collected data may still be processing.</p> : null}
        <Card>
          <h3 className="text-lg font-semibold">Daily page views</h3>
          <p className="mt-1 text-sm text-muted-foreground">{data.daily[0].date} – {data.daily[data.daily.length - 1].date} · {data.timeZone}</p>
          <div className="mt-6 overflow-x-auto">
            <svg viewBox="0 0 800 230" className="w-full min-w-[480px] text-primary" role="img" aria-label={`Daily page views for the last ${days} complete days. Exact values are in the daily data table below.`}>
              {[0, 0.5, 1].map(fraction => <g key={fraction}><line x1="55" x2="790" y1={190 - fraction * 170} y2={190 - fraction * 170} stroke="currentColor" opacity="0.12" /><text x="45" y={195 - fraction * 170} textAnchor="end" fontSize="12" fill="currentColor">{number.format(Math.round(maximum * fraction))}</text></g>)}
              {data.daily.map((day, index) => <rect key={day.date} x={60 + index * 725 / days} y={190 - day.views / maximum * 170} width={Math.max(2, 725 / days - 3)} height={day.views / maximum * 170} rx="2" fill="currentColor"><title>{day.date}: {number.format(day.views)} views</title></rect>)}
              <text x="60" y="218" fontSize="12" fill="currentColor">{data.daily[0].date}</text><text x="785" y="218" textAnchor="end" fontSize="12" fill="currentColor">{data.daily[data.daily.length - 1].date}</text>
            </svg>
          </div>
          <details className="mt-4 text-sm"><summary className="focus-ring cursor-pointer font-semibold">View daily data</summary><div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-left"><thead><tr><th scope="col" className="p-2">Date</th><th scope="col" className="p-2 text-right">Page views</th></tr></thead><tbody>{data.daily.map(day => <tr key={day.date} className="border-t border-border"><td className="p-2">{day.date}</td><td className="p-2 text-right tabular-nums">{number.format(day.views)}</td></tr>)}</tbody></table></div></details>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <ReportTable title="Top pages" label="Page path" metric="Page views" rows={data.pages} />
          <ReportTable title="Traffic sources" label="Channel" metric="Sessions" rows={data.sources} />
          <ReportTable title="Devices" label="Device" metric="Active users" rows={data.devices} />
          <ReportTable title="Top countries" label="Country" metric="Active users" rows={data.countries} />
        </div>
        <p className="text-xs leading-5 text-muted-foreground">Fetched {new Date(data.updatedAt).toLocaleString("en-US", { timeZone: data.timeZone })} ({data.timeZone}). Google may revise recent data as processing finishes. Reports include all traffic collected by this property.{data.limited ? " Google has applied reporting thresholds or grouped some results; displayed details may not add up to totals." : ""}</p>
      </> : null}
    </div>
  );
}
