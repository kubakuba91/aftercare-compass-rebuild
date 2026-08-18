import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { BackLink } from "@/components/public/back-link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { commitProviderCsv } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProviderImportPreviewPage({ params, searchParams }: { params: Promise<{ batchId: string }>; searchParams: Promise<{ committed?: string }> }) {
  const [appUser, route, query] = await Promise.all([getProtectedAppUser("/dashboard/admin/imports"), params, searchParams]);
  if (appUser.role !== Role.system_admin) redirect("/dashboard");
  const batch = await prisma.providerImportBatch.findUnique({ where: { id: route.batchId }, include: { rows: { orderBy: { rowNumber: "asc" } } } });
  if (!batch) notFound();
  const canCommit = batch.status === "validated" && batch.rows.some((row) => row.status === "validated");

  return <main className="shell py-8">
    <BackLink href="/dashboard/admin/imports">Back to imports</BackLink>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5"><div><h1 className="text-3xl font-semibold">Import preview</h1><p className="mt-2 text-sm text-muted-foreground">{batch.sourceFileName}</p></div><Link className="rounded-md border border-border px-4 py-2 text-sm font-semibold" href={`/dashboard/admin/imports/${batch.id}/results`}>Download results CSV</Link></div>
    {query.committed ? <div className="mt-5 rounded-md border border-success/30 bg-success/10 p-3 text-sm">Import completed. Searchable locations are now live.</div> : null}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card><p className="text-sm text-muted-foreground">New organizations</p><p className="mt-2 text-3xl font-semibold">{batch.newOrganizationCount}</p></Card>
      <Card><p className="text-sm text-muted-foreground">New locations</p><p className="mt-2 text-3xl font-semibold">{batch.newLocationCount}</p></Card>
      <Card><p className="text-sm text-muted-foreground">Matched to existing</p><p className="mt-2 text-3xl font-semibold">{batch.matchedLocationCount}</p></Card>
      <Card><p className="text-sm text-muted-foreground">Rejected rows</p><p className="mt-2 text-3xl font-semibold">{batch.rejectedRowCount}</p></Card>
    </div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><div><Badge>{batch.status.replaceAll("_", " ")}</Badge><span className="ml-3 text-sm text-muted-foreground">{batch.totalRows} total rows</span></div>
      {canCommit ? <form action={commitProviderCsv}><input name="batchId" type="hidden" value={batch.id}/><button className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground" type="submit">Commit valid rows</button></form> : null}
    </div>
    <div className="mt-5 overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-muted/50"><tr><th className="p-3">Row</th><th className="p-3">Organization</th><th className="p-3">Program</th><th className="p-3">Address</th><th className="p-3">Result</th><th className="p-3">Errors / message</th></tr></thead><tbody>
      {batch.rows.map((row) => { const raw = row.rawData as Record<string, string>; return <tr className="border-t border-border align-top" key={row.id}><td className="p-3">{row.rowNumber}</td><td className="p-3">{raw.organization_name}</td><td className="p-3 font-medium">{raw.program_name}</td><td className="p-3">{[raw.address, raw.city, raw.state, raw.zip].filter(Boolean).join(", ")}</td><td className="p-3"><Badge tone={row.status === "rejected" || row.status === "failed" || row.previewAction.includes("update") ? "warning" : "success"}>{row.previewAction}</Badge></td><td className="max-w-md p-3 text-sm">{row.errorReasons.length ? row.errorReasons.join(" ") : row.resultMessage || "Ready to commit."}</td></tr>; })}
    </tbody></table></div>
  </main>;
}
