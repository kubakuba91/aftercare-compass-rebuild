import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, FileUp } from "lucide-react";
import { Role } from "@prisma/client";
import { BackLink } from "@/components/public/back-link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format-utils";
import { prisma } from "@/lib/prisma";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { uploadProviderCsv } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProviderImportsPage({ searchParams }: { searchParams: Promise<{ message?: string; tone?: string }> }) {
  const [appUser, query] = await Promise.all([getProtectedAppUser("/dashboard/admin/imports"), searchParams]);
  if (appUser.role !== Role.system_admin) redirect("/dashboard");
  const imports = await prisma.providerImportBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { actorUser: { select: { firstName: true, lastName: true, email: true } } }
  });

  return <main className="shell py-8">
    <BackLink href="/dashboard/admin?tab=profiles">Back to Homes & Programs</BackLink>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div><h1 className="text-3xl font-semibold">Provider CSV imports</h1><p className="mt-2 text-sm text-muted-foreground">Validate, preview, and import organizations with their locations.</p></div>
      <Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold" href="/dashboard/admin/imports/template"><Download size={16}/> Download template</Link>
    </div>
    {query.message ? <div className={`mt-5 rounded-md border p-3 text-sm ${query.tone === "success" ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10"}`}>{query.message}</div> : null}
    <Card className="mt-6">
      <div className="flex items-center gap-3"><FileUp className="text-primary"/><div><h2 className="font-semibold">Upload CSV</h2><p className="text-sm text-muted-foreground">Nothing is published until you review the validation preview and commit.</p></div></div>
      <form action={uploadProviderCsv} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" encType="multipart/form-data">
        <label className="grid flex-1 gap-2 text-sm font-medium">CSV file<input accept=".csv,text/csv" className="min-h-11 rounded-md border border-border bg-white px-3 py-2" name="file" required type="file"/></label>
        <button className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground" type="submit">Validate and preview</button>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">Maximum 5,000 rows or 10 MB. Separate multiple values and photo URLs with semicolons.</p>
    </Card>
    <section className="mt-8"><h2 className="text-xl font-semibold">Import history</h2>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-muted/50"><tr><th className="p-3">Uploaded</th><th className="p-3">File</th><th className="p-3">Admin</th><th className="p-3">Status</th><th className="p-3">Rows</th><th className="p-3">Results</th></tr></thead><tbody>
        {imports.map((item) => <tr className="border-t border-border" key={item.id}><td className="p-3">{formatDate(item.createdAt)}</td><td className="p-3 font-medium"><Link className="text-primary" href={`/dashboard/admin/imports/${item.id}`}>{item.sourceFileName}</Link></td><td className="p-3">{[item.actorUser?.firstName, item.actorUser?.lastName].filter(Boolean).join(" ") || item.actorUser?.email || "Deleted admin"}</td><td className="p-3"><Badge>{item.status.replaceAll("_", " ")}</Badge></td><td className="p-3">{item.totalRows}</td><td className="p-3"><Link className="font-semibold text-primary" href={`/dashboard/admin/imports/${item.id}/results`}>Download CSV</Link></td></tr>)}
        {!imports.length ? <tr><td className="p-6 text-center text-muted-foreground" colSpan={6}>No imports yet.</td></tr> : null}
      </tbody></table></div>
    </section>
  </main>;
}
