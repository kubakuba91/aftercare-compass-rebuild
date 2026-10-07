import Link from "next/link";
import { Role } from "@prisma/client";
import { Search, Users, UserPlus, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/format-utils";
import { newUserCutoff, userDirectoryWhere, userRoleLabels } from "@/lib/admin-users";

type DirectoryQuery = Record<string, string | string[] | undefined>;
const fieldClass = "min-h-11 rounded-xl border border-border bg-white px-3 text-sm";

export async function UsersPanel({ query }: { query: DirectoryQuery }) {
  const actor = await getProtectedAppUser("/dashboard/admin?tab=users");
  if (actor.role !== Role.system_admin || !actor.isActive) redirect("/dashboard");
  const one = (key: string) => { const value = query[key]; return Array.isArray(value) ? value[0] || "" : value || ""; };
  const q = one("userSearch").trim().slice(0, 200);
  const role = Object.values(Role).includes(one("userRole") as Role) ? one("userRole") : "";
  const status = ["active", "inactive"].includes(one("userStatus")) ? one("userStatus") : "";
  const joined = one("userJoined") === "new" ? "new" : "";
  const cutoff = newUserCutoff();
  const where = userDirectoryWhere({ q, role, status, joined });
  const [total, newCount, activeCount, matched] = await Promise.all([
    prisma.user.count(), prisma.user.count({ where: { createdAt: { gte: cutoff } } }),
    prisma.user.count({ where: { isActive: true } }), prisma.user.count({ where })
  ]);
  const pageCount = Math.max(1, Math.ceil(matched / 25));
  const requestedPage = Number(one("userPage"));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, pageCount) : 1;
  const users = await prisma.user.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * 25, take: 25, select: {
    id: true, firstName: true, lastName: true, email: true, emailVerified: true, role: true, isActive: true, createdAt: true,
    organization: { select: { id: true, name: true } }
  } });
  const params = new URLSearchParams({ tab: "users" });
  for (const [key, value] of Object.entries({ userSearch: q, userRole: role, userStatus: status, userJoined: joined })) if (value) params.set(key, value);
  const pageHref = (next: number) => { const nextParams = new URLSearchParams(params); nextParams.set("userPage", String(next)); return `/dashboard/admin?${nextParams}`; };

  return <section className="mt-6 grid gap-5" aria-labelledby="users-heading">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[["All users", total], ["New in the last 7 days", newCount], ["Active users", activeCount], ["Inactive users", total - activeCount]].map(([label, count]) => <Card key={label} className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{count}</p></Card>)}
    </div>
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="users-heading" className="flex items-center gap-2 text-xl font-semibold"><Users size={20} /> Users</h2><p className="mt-1 text-sm text-muted-foreground">Search accounts, review organization access, and manage user details.</p></div><Badge tone="verified">{matched} {matched === 1 ? "user" : "users"}</Badge></div>
        <form action="/dashboard/admin" className="mt-5 flex flex-wrap items-end gap-3">
          <input type="hidden" name="tab" value="users" />
          <label className="grid min-w-52 flex-1 gap-1.5 text-sm font-medium">Search users<input className={fieldClass} name="userSearch" defaultValue={q} placeholder="Name, email, or organization" maxLength={200} type="search" /></label>
          <label className="grid gap-1.5 text-sm font-medium">Role<select className={fieldClass} name="userRole" defaultValue={role}><option value="">All roles</option>{Object.entries(userRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-medium">Status<select className={fieldClass} name="userStatus" defaultValue={status}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          <label className="grid gap-1.5 text-sm font-medium">Joined<select className={fieldClass} name="userJoined" defaultValue={joined}><option value="">Any time</option><option value="new">Last 7 days</option></select></label>
          <button className="focus-ring ac-button ac-button--primary"><Search size={16} /> Search</button>
          {q || role || status || joined ? <Link className="focus-ring ac-button ac-button--secondary" href="/dashboard/admin?tab=users">Clear</Link> : null}
        </form>
      </div>
      {users.length ? <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-black/[0.025] text-xs uppercase tracking-wide text-muted-foreground"><tr>{["User", "Role", "Organization", "Status", "Joined", ""].map((label) => <th key={label} scope="col" className="px-5 py-3">{label || <span className="sr-only">Manage</span>}</th>)}</tr></thead><tbody>
        {users.map((user) => { const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Name not provided"; return <tr key={user.id} className="border-t border-border hover:bg-black/[0.015]">
          <td className="px-5 py-4"><div className="flex flex-wrap items-center gap-2"><Link className="focus-ring font-semibold hover:underline" href={`/dashboard/admin/users/${user.id}`}>{name}</Link>{user.createdAt >= cutoff ? <Badge tone="success"><UserPlus size={12} /> New</Badge> : null}</div><p className="mt-1 break-all text-muted-foreground">{user.email}</p>{!user.emailVerified ? <p className="mt-1 text-xs text-amber-700">Email unverified</p> : null}</td>
          <td className="px-5 py-4">{userRoleLabels[user.role]}</td>
          <td className="px-5 py-4">{user.organization ? <Link className="focus-ring hover:underline" href={`/dashboard/admin?${new URLSearchParams({ tab: "organizations", organizationSearch: user.organization.name })}`}>{user.organization.name}</Link> : <span className="text-muted-foreground">No organization</span>}</td>
          <td className="px-5 py-4"><Badge tone={user.isActive ? "success" : "neutral"}>{user.isActive ? "Active" : "Inactive"}</Badge></td><td className="whitespace-nowrap px-5 py-4">{formatDate(user.createdAt)}</td>
          <td className="px-5 py-4"><Link aria-label={`Manage ${name === "Name not provided" ? user.email : name}`} className="focus-ring inline-flex items-center gap-1 font-semibold text-primary hover:underline" href={`/dashboard/admin/users/${user.id}`}>Manage <ArrowUpRight size={15} /></Link></td>
        </tr>; })}
      </tbody></table></div> : <div className="px-6 py-14 text-center"><Users className="mx-auto text-muted-foreground" size={28} /><h3 className="mt-3 font-semibold">{total ? "No users match these filters" : "No users yet"}</h3><p className="mt-2 text-sm text-muted-foreground">{total ? "Try another name, email, or organization, or clear the filters." : "Accounts will appear here when users begin signing up in the app."}</p></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm"><p className="text-muted-foreground">Showing {matched ? (page - 1) * 25 + 1 : 0}–{Math.min(page * 25, matched)} of {matched} · Newest accounts first</p><nav aria-label="User directory pagination" className="flex items-center gap-3">{page > 1 ? <Link className="focus-ring ac-button ac-button--secondary" href={pageHref(page - 1)}>Previous</Link> : null}<span>Page {page} of {pageCount}</span>{page < pageCount ? <Link className="focus-ring ac-button ac-button--secondary" href={pageHref(page + 1)}>Next</Link> : null}</nav></div>
    </Card>
  </section>;
}
