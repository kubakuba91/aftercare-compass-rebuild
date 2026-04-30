import Link from "next/link";
import {
  BedDouble,
  Building2,
  CalendarClock,
  CreditCard,
  Home,
  Inbox,
  MessageSquare,
  Settings,
  ShieldCheck,
  UserCircle,
  Users
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  getAftercareDashboardUser,
  redirectIncompleteAftercareOnboarding
} from "@/lib/protected-routing";
import { cn } from "@/lib/utils";
import { updateAftercareAvailability } from "./actions";

export const dynamic = "force-dynamic";

const dashboardTabs = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "homes", label: "Homes", icon: Building2 },
  { key: "managers", label: "Managers", icon: Users },
  { key: "subscription", label: "Subscription", icon: CreditCard },
  { key: "account", label: "Account", icon: Settings }
] as const;

type DashboardTab = (typeof dashboardTabs)[number]["key"];

function isDashboardTab(value: string | undefined): value is DashboardTab {
  return dashboardTabs.some((tab) => tab.key === value);
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "Not updated";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(value);
}

function profileReadiness(profile: {
  type: string;
  description: string | null;
  admissionsContactEmail: string | null;
  admissionsContactPhone: string | null;
  certificationsHeld: string[];
  goodNeighborPolicyAcknowledged: boolean;
  populationServedOptions: string[];
  populationServed: string | null;
  photoReadiness: string[];
  totalBeds: number | null;
  bedsAvailable: number | null;
  acceptingNewPatients: boolean | null;
}) {
  const checks = [
    Boolean(profile.description),
    Boolean(profile.admissionsContactEmail || profile.admissionsContactPhone),
    profile.type === "sober_living"
      ? Boolean(profile.totalBeds !== null && profile.bedsAvailable !== null)
      : profile.acceptingNewPatients !== null,
    Boolean(profile.populationServedOptions.length || profile.populationServed),
    Boolean(profile.certificationsHeld.length),
    profile.goodNeighborPolicyAcknowledged || profile.type === "continued_care",
    Boolean(profile.photoReadiness.length)
  ];

  const complete = checks.filter(Boolean).length;
  return {
    complete,
    total: checks.length,
    percent: Math.round((complete / checks.length) * 100)
  };
}

function availabilityLabel(profile: {
  type: string;
  totalBeds: number | null;
  bedsAvailable: number | null;
  acceptingNewPatients: boolean | null;
}) {
  if (profile.type === "sober_living") {
    return `${profile.bedsAvailable ?? 0} of ${profile.totalBeds ?? 0} beds available`;
  }

  return profile.acceptingNewPatients ? "Accepting new patients" : "Not accepting patients";
}

function addProfileHref(organizationType: string | undefined) {
  if (organizationType === "aftercare_continued_care") {
    return "/onboarding/aftercare/continued-care/1?new=1";
  }

  return "/onboarding/aftercare/sober-living/1?new=1";
}

export default async function AftercareDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const appUser = await getAftercareDashboardUser();
  await redirectIncompleteAftercareOnboarding(appUser.orgId);

  const { tab } = await searchParams;
  const activeTab = isDashboardTab(tab) ? tab : "overview";

  const [profiles, leads, referrals, pendingDocumentCount, managers] = await Promise.all([
    prisma.aftercareProfile.findMany({
      where: { orgId: appUser.orgId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        programName: true,
        type: true,
        status: true,
        verificationTier: true,
        publicCity: true,
        publicState: true,
        admissionsContactEmail: true,
        admissionsContactPhone: true,
        description: true,
        certificationsHeld: true,
        goodNeighborPolicyAcknowledged: true,
        populationServed: true,
        populationServedOptions: true,
        photoReadiness: true,
        totalBeds: true,
        bedsAvailable: true,
        bedsAvailableUpdatedAt: true,
        acceptingNewPatients: true,
        acceptingNewPatientsUpdatedAt: true,
        availabilityNotes: true,
        updatedAt: true,
        _count: {
          select: {
            leads: true,
            referrals: true,
            certifications: true
          }
        }
      }
    }),
    prisma.lead.findMany({
      where: { aftercareOrgId: appUser.orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        profile: { select: { programName: true } }
      }
    }),
    prisma.referral.findMany({
      where: {
        aftercareOrgId: appUser.orgId,
        status: { in: ["pending", "viewed", "accepted", "waitlisted"] }
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        caseManagerOrganization: true,
        clientAgeRange: true,
        preferredStartWindow: true,
        createdAt: true,
        aftercareProfile: { select: { programName: true } }
      }
    }),
    prisma.verificationDocument.count({
      where: {
        status: "pending",
        profile: { orgId: appUser.orgId }
      }
    }),
    prisma.user.findMany({
      where: { orgId: appUser.orgId },
      orderBy: [{ role: "asc" }, { email: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    })
  ]);

  const totalBeds = profiles.reduce((sum, profile) => sum + (profile.totalBeds ?? 0), 0);
  const availableBeds = profiles.reduce((sum, profile) => sum + (profile.bedsAvailable ?? 0), 0);
  const newLeadCount = leads.filter((lead) => lead.status === "new").length;
  const staleAvailabilityCount = profiles.filter((profile) => {
    const lastUpdated =
      profile.type === "sober_living"
        ? profile.bedsAvailableUpdatedAt
        : profile.acceptingNewPatientsUpdatedAt;

    if (!lastUpdated) {
      return true;
    }

    return Date.now() - lastUpdated.getTime() > 1000 * 60 * 60 * 24 * 7;
  }).length;

  const metrics = [
    { label: "Total beds", value: totalBeds.toString(), icon: BedDouble },
    { label: "Beds available now", value: availableBeds.toString(), icon: CalendarClock },
    { label: "Open referrals", value: referrals.length.toString(), icon: Inbox },
    { label: "New public leads", value: newLeadCount.toString(), icon: MessageSquare }
  ];

  return (
    <main className="shell py-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">{appUser.organization?.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SignOutButton />
          <Link
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            href={addProfileHref(appUser.organization?.type)}
          >
            Add home
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-lg border border-border bg-white p-4 shadow-sm">
          <nav className="grid gap-1">
            {dashboardTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <Link
                  key={item.key}
                  className={cn(
                    "focus-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold",
                    isActive
                      ? "border border-primary bg-primary/5 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  href={`/dashboard/aftercare?tab=${item.key}`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          {activeTab === "overview" ? (
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-4">
                {metrics.map((metric) => {
                  const Icon = metric.icon;

                  return (
                    <Card key={metric.label} className="min-h-32">
                      <Icon className="text-primary" size={22} />
                      <p className="mt-3 text-sm text-muted-foreground">{metric.label}</p>
                      <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
                    </Card>
                  );
                })}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
                <Card>
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <h2 className="text-xl font-semibold">High-level insights</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Keep homes referral-ready, availability fresh, and inbound lead/referral
                        work visible from one place.
                      </p>
                    </div>
                    <Badge tone={staleAvailabilityCount ? "warning" : "success"}>
                      {staleAvailabilityCount ? `${staleAvailabilityCount} stale availability` : "Availability current"}
                    </Badge>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-border bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">Profiles</p>
                      <p className="mt-1 text-2xl font-semibold">{profiles.length}</p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">Pending documents</p>
                      <p className="mt-1 text-2xl font-semibold">{pendingDocumentCount}</p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">Self-reported listings</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {profiles.filter((profile) => profile.verificationTier === 1).length}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <ShieldCheck className="text-primary" size={24} />
                  <h2 className="mt-3 font-semibold">Verification status</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Profiles can operate as Tier 1 self-reported listings while documents wait for
                    admin review. Reviews and ratings stay out of v1.
                  </p>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">Recent referrals</h2>
                    <Badge>{referrals.length} open</Badge>
                  </div>
                  {referrals.length ? (
                    <div className="mt-4 grid gap-3">
                      {referrals.map((referral) => (
                        <div key={referral.id} className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                          <div className="flex justify-between gap-3">
                            <p className="font-semibold">{referral.caseManagerOrganization}</p>
                            <Badge tone="warning">{referral.status}</Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {referral.aftercareProfile.programName} · {referral.clientAgeRange} · {referral.preferredStartWindow}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      New referrals will appear here with status actions in the next dashboard phase.
                    </p>
                  )}
                </Card>

                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">Recent public leads</h2>
                    <Badge>{leads.length} recent</Badge>
                  </div>
                  {leads.length ? (
                    <div className="mt-4 grid gap-3">
                      {leads.map((lead) => (
                        <div key={lead.id} className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                          <div className="flex justify-between gap-3">
                            <p className="font-semibold">{lead.name}</p>
                            <Badge tone={lead.status === "new" ? "warning" : "neutral"}>{lead.status}</Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {lead.profile.programName} · {lead.email}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Public profile contact forms will create internal lead records here.
                    </p>
                  )}
                </Card>
              </div>
            </div>
          ) : null}

          {activeTab === "homes" ? (
            <Card>
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-semibold">Homes</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    List view of every home/program under this account.
                  </p>
                </div>
                <Link
                  className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                  href={addProfileHref(appUser.organization?.type)}
                >
                  Add home
                </Link>
              </div>

              {profiles.length ? (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                        <th className="py-3 pr-4 font-semibold">Name</th>
                        <th className="py-3 pr-4 font-semibold">Type</th>
                        <th className="py-3 pr-4 font-semibold">Status</th>
                        <th className="py-3 pr-4 font-semibold">Availability</th>
                        <th className="py-3 pr-4 font-semibold">Readiness</th>
                        <th className="py-3 pr-4 font-semibold">Last update</th>
                        <th className="py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((profile) => {
                        const readiness = profileReadiness(profile);

                        return (
                          <tr key={profile.id} className="border-b border-border last:border-0">
                            <td className="py-4 pr-4">
                              <p className="font-semibold">{profile.programName}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {profile.publicCity}, {profile.publicState}
                              </p>
                            </td>
                            <td className="py-4 pr-4">
                              {profile.type === "sober_living" ? "Sober Living" : "Continued Care"}
                            </td>
                            <td className="py-4 pr-4">
                              <Badge tone={profile.status === "published" ? "success" : "warning"}>
                                {profile.status}
                              </Badge>
                            </td>
                            <td className="py-4 pr-4">{availabilityLabel(profile)}</td>
                            <td className="py-4 pr-4">{readiness.percent}%</td>
                            <td className="py-4 pr-4">
                              {formatDate(
                                profile.type === "sober_living"
                                  ? profile.bedsAvailableUpdatedAt
                                  : profile.acceptingNewPatientsUpdatedAt
                              )}
                            </td>
                            <td className="py-4">
                              <div className="flex justify-end gap-2">
                                <Link
                                  className="focus-ring inline-flex min-h-9 items-center rounded-md border border-border px-3 text-xs font-semibold"
                                  href={`/dashboard/aftercare/profiles/${profile.id}`}
                                >
                                  Edit
                                </Link>
                                <Link
                                  className="focus-ring inline-flex min-h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
                                  href={`/profiles/${profile.slug}`}
                                >
                                  View profile
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-5 rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  No homes or programs have been created yet.
                </div>
              )}
            </Card>
          ) : null}

          {activeTab === "managers" ? (
            <Card>
              <h2 className="text-xl font-semibold">Managers</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Users associated with this account and their current roles.
              </p>
              <div className="mt-5 grid gap-3">
                {managers.map((manager) => (
                  <div key={manager.id} className="flex flex-col justify-between gap-3 rounded-md border border-border p-4 md:flex-row md:items-center">
                    <div>
                      <p className="font-semibold">
                        {[manager.firstName, manager.lastName].filter(Boolean).join(" ") || manager.email}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{manager.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{manager.role.replaceAll("_", " ")}</Badge>
                      <Badge tone={manager.isActive ? "success" : "warning"}>
                        {manager.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {activeTab === "subscription" ? (
            <Card>
              <CreditCard className="text-primary" size={24} />
              <h2 className="mt-3 text-xl font-semibold">Subscription</h2>
              <dl className="mt-5 grid gap-4 text-sm md:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd className="mt-1 font-semibold">{appUser.organization?.subscriptionPlan || "Trial / setup"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-1 font-semibold">{appUser.organization?.subscriptionStatus || "Not connected"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Billing cycle</dt>
                  <dd className="mt-1 font-semibold">{appUser.organization?.subscriptionBillingCycle || "Not selected"}</dd>
                </div>
              </dl>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Stripe management will be connected in a billing pass. For now, onboarding and
                dashboard access are not blocked by payment setup.
              </p>
            </Card>
          ) : null}

          {activeTab === "account" ? (
            <Card>
              <UserCircle className="text-primary" size={24} />
              <h2 className="mt-3 text-xl font-semibold">Account</h2>
              <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Organization display name</dt>
                  <dd className="mt-1 font-semibold">{appUser.organization?.name || "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Primary email</dt>
                  <dd className="mt-1 font-semibold">{appUser.organization?.email || appUser.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="mt-1 font-semibold">{appUser.organization?.phone || "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Website</dt>
                  <dd className="mt-1 font-semibold">{appUser.organization?.website || "Not set"}</dd>
                </div>
              </dl>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Profile picture, display name editing, and account preferences will be added in a
                follow-up pass.
              </p>
            </Card>
          ) : null}
        </section>
      </div>
    </main>
  );
}
