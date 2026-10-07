import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { ArrowLeft, Building2, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { prisma } from "@/lib/prisma";
import { editableUserRoles, newUserCutoff, userRoleLabels } from "@/lib/admin-users";
import { formatDate, formatValue } from "@/lib/format-utils";
import { updateAdminUser } from "../actions";

export const dynamic = "force-dynamic";
const inputClass = "min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm";
const activityLabels: Record<string, string> = { user_details_updated: "Account details updated", user_deactivated: "Account deactivated", user_reactivated: "Account reactivated" };

export default async function AdminUserPage({ params, searchParams }: { params: Promise<{ userId: string }>; searchParams: Promise<{ message?: string; error?: string }> }) {
  const actor = await getProtectedAppUser("/dashboard/admin?tab=users");
  if (actor.role !== Role.system_admin || !actor.isActive) redirect("/dashboard");
  const [{ userId }, query] = await Promise.all([params, searchParams]);
  const user = await prisma.user.findUnique({ where: { id: userId }, include: {
    organization: { include: { _count: { select: { users: true, profiles: true } } } },
    aftercareProfileAssignments: { include: { profile: { select: { id: true, programName: true, orgId: true } } } },
    onboardingDraft: { select: { activeStep: true, completedAt: true, selectedAccountType: true } },
    _count: { select: { referrals: true, sentMessages: true, favorites: true } }
  } });
  if (!user) notFound();
  const activity = await prisma.adminAuditLog.findMany({ where: { entityType: "user", entityId: user.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, include: { actorUser: { select: { firstName: true, lastName: true, email: true } } } });
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const roles = editableUserRoles(user.role, user.organization?.type);
  const org = user.organization;
  const versionInputs = <><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="version" value={user.updatedAt.toISOString()} /></>;
  return <main className="shell py-8">
    <Link className="focus-ring inline-flex items-center gap-2 text-sm font-semibold" href="/dashboard/admin?tab=users"><ArrowLeft size={16} /> All users</Link>
    <div className="mt-6 flex flex-wrap items-center gap-4"><span className="rounded-2xl bg-white p-4 shadow-sm"><UserRound size={28} /></span><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-semibold">{name}</h1><Badge tone={user.isActive ? "success" : "neutral"}>{user.isActive ? "Active" : "Inactive"}</Badge>{user.createdAt >= newUserCutoff() ? <Badge tone="verified">New · Last 7 days</Badge> : null}</div><p className="mt-2 break-all text-muted-foreground">{user.email}</p></div></div>
    {query.message ? <p role={query.error === "1" ? "alert" : "status"} className={`mt-5 rounded-xl border p-4 text-sm ${query.error === "1" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{query.message}</p> : null}
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-5">
        <Card><h2 className="text-xl font-semibold">Account details</h2><p className="mt-1 text-sm text-muted-foreground">Update contact details and the user’s role within their current organization.</p>
          <form action={updateAdminUser} className="mt-5 grid gap-4" key={user.updatedAt.toISOString()}>{versionInputs}<input type="hidden" name="intent" value="details" />
            <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">First name<input className={inputClass} name="firstName" defaultValue={user.firstName || ""} maxLength={80} /></label><label className="grid gap-2 text-sm font-medium">Last name<input className={inputClass} name="lastName" defaultValue={user.lastName || ""} maxLength={80} /></label></div>
            <div><p className="text-sm font-medium">Sign-in email</p><p className="mt-2 break-all">{user.email}</p><p className="mt-1 text-xs text-muted-foreground">{user.emailVerified ? "Verified" : "Not verified"} · Managed by the authentication provider</p></div>
            <label className="grid gap-2 text-sm font-medium">Phone<input className={inputClass} type="tel" name="phone" defaultValue={user.phone || ""} maxLength={40} /><span className="text-xs font-normal text-muted-foreground">Changing the phone clears SMS opt-in. The user must consent again for the new number.</span></label>
            <label className="grid gap-2 text-sm font-medium">Role<select className={inputClass} name="role" defaultValue={user.role} disabled={actor.id === user.id || roles.length === 1}>{roles.map((role) => <option key={role} value={role}>{userRoleLabels[role]}</option>)}</select></label>
            {actor.id === user.id || roles.length === 1 ? <input type="hidden" name="role" value={user.role} /> : null}
            {user.role === Role.aftercare_manager ? <p className="text-sm text-muted-foreground">Program access: {user.aftercareManagerScope === "all_profiles" ? "All organization programs" : "Assigned programs only"}. Existing assignments are retained when roles change.</p> : null}
            <div><button className="focus-ring ac-button ac-button--primary">Save account details</button></div>
          </form>
        </Card>
        <Card><h2 className="flex items-center gap-2 text-xl font-semibold"><Building2 size={20} /> Associated organization</h2>
          {org ? <><div className="mt-4 flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{org.name}</h3><p className="mt-1 text-sm text-muted-foreground">{formatValue(org.type, { titleCase: true })}</p></div><Badge tone="neutral">Membership read-only</Badge></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">{[["Subscription", formatValue(org.subscriptionPlan, { titleCase: true })], ["Billing status", formatValue(org.subscriptionStatus, { titleCase: true })], ["Organization email", org.email || "Not provided"], ["Organization phone", org.phone || "Not provided"], ["Users", String(org._count.users)], ["Homes / programs", String(org._count.profiles)]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl><Link className="focus-ring mt-5 inline-flex font-semibold text-primary hover:underline" href={`/dashboard/admin?${new URLSearchParams({ tab: "organizations", organizationSearch: org.name })}`}>View organization →</Link></> : <p className="mt-4 text-sm text-muted-foreground">This account is not associated with an organization.</p>}
          {user.aftercareProfileAssignments.length ? <div className="mt-5 border-t border-border pt-4"><h3 className="text-sm font-semibold">Assigned programs</h3><ul className="mt-2 grid gap-2 text-sm">{user.aftercareProfileAssignments.map(({ profile }) => <li key={profile.id}><Link className="focus-ring text-primary hover:underline" href={`/dashboard/admin/profiles/${profile.id}/edit`}>{profile.programName}</Link>{profile.orgId !== user.orgId ? <span className="ml-2 text-amber-700">Outside current organization · no access</span> : null}</li>)}</ul></div> : null}
        </Card>
        <Card><h2 className="text-xl font-semibold">Admin activity</h2><p className="mt-1 text-sm text-muted-foreground">The latest 20 management changes to this account.</p>{activity.length ? <ul className="mt-4 divide-y divide-border">{activity.map((entry) => <li className="py-3" key={entry.id}><p className="text-sm font-semibold">{activityLabels[entry.action] || formatValue(entry.action, { titleCase: true })}</p><p className="mt-1 text-xs text-muted-foreground">{entry.actorUser ? [entry.actorUser.firstName, entry.actorUser.lastName].filter(Boolean).join(" ") || entry.actorUser.email : "Former administrator"} · {formatDate(entry.createdAt, { options: { dateStyle: "medium", timeStyle: "short" } })}</p></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No admin changes recorded yet.</p>}</Card>
      </div>
      <aside className="grid content-start gap-5">
        <Card><h2 className="text-xl font-semibold">Account overview</h2><dl className="mt-4 grid gap-4 text-sm">{[["Joined", formatDate(user.createdAt)], ["Last account update", formatDate(user.updatedAt)], ["Role", userRoleLabels[user.role]], ["Email verification", user.emailVerified ? "Verified" : "Unverified"], ["SMS consent", user.smsOptIn ? "Opted in" : "Not opted in"], ["Onboarding", user.onboardingDraft ? user.onboardingDraft.completedAt ? "Completed" : `In progress · Step ${user.onboardingDraft.activeStep}` : "No onboarding record"], ["Referrals sent", String(user._count.referrals)], ["Messages sent", String(user._count.sentMessages)], ["Saved programs", String(user._count.favorites)], ["User ID", user.id], ["Authentication ID", user.clerkUserId]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-all font-medium">{value}</dd></div>)}</dl></Card>
        <Card><h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck size={20} /> Account access</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Deactivation blocks signed-in app access and preserves the account’s history and organization membership.</p>
          {actor.id === user.id || user.role === Role.system_admin ? <p className="mt-4 text-sm font-medium">{actor.id === user.id ? "You cannot deactivate your own account." : "System administrator access is protected."}</p> : <form action={updateAdminUser} className="mt-4">{versionInputs}<input type="hidden" name="intent" value="access" /><input type="hidden" name="isActive" value={String(!user.isActive)} /><ConfirmSubmitButton className="focus-ring ac-button ac-button--secondary" message={`${user.isActive ? "Deactivate" : "Reactivate"} ${name}? ${user.isActive ? "Their signed-in app access will be blocked." : "Their existing role and organization access will be restored."}`}>{user.isActive ? "Deactivate user" : "Reactivate user"}</ConfirmSubmitButton></form>}
        </Card>
      </aside>
    </div>
  </main>;
}
