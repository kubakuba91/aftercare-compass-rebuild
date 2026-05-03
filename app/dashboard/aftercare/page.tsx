import Link from "next/link";
import {
  BedDouble,
  Building2,
  CreditCard,
  Home,
  Pencil,
  Settings,
  ShieldCheck,
  UserCircle,
  Users
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AftercareOverviewSelector } from "@/components/dashboard/aftercare-overview-selector";
import { AftercareQuickAvailability } from "@/components/dashboard/aftercare-quick-availability";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getVisiblePopulationBeds } from "@/lib/bed-display";
import { prisma } from "@/lib/prisma";
import {
  getAftercareDashboardUser,
  redirectIncompleteAftercareOnboarding
} from "@/lib/protected-routing";
import { cn } from "@/lib/utils";
import { updateAftercareAvailability, updateReferralStatus, updateUserDisplayName } from "./actions";

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

function formatReferralValue(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function referralActionOptions(status: string) {
  if (status === "pending" || status === "viewed") {
    return [
      ["accepted", "Accept"],
      ["waitlisted", "Waitlist"],
      ["declined", "Decline"],
      ["closed", "Close"]
    ];
  }

  if (status === "accepted") {
    return [
      ["placed", "Mark placed"],
      ["closed", "Close"]
    ];
  }

  if (status === "waitlisted") {
    return [
      ["accepted", "Accept"],
      ["declined", "Decline"],
      ["closed", "Close"]
    ];
  }

  return [];
}

function compactReferralActionOptions(status: string) {
  if (status === "pending" || status === "viewed") {
    return [
      ["accepted", "Accept"],
      ["waitlisted", "Waitlist"]
    ];
  }

  if (status === "accepted") {
    return [["placed", "Mark placed"]];
  }

  if (status === "waitlisted") {
    return [["accepted", "Accept"]];
  }

  return [];
}

function referralDetailHref(referralId: string, profileId?: string) {
  const params = new URLSearchParams({
    tab: "overview",
    referralId
  });

  if (profileId) {
    params.set("profileId", profileId);
  }

  return `/dashboard/aftercare?${params.toString()}`;
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
  searchParams: Promise<{
    tab?: string;
    edit?: string;
    availabilityError?: string;
    profileId?: string;
    referralError?: string;
    referralId?: string;
  }>;
}) {
  const appUser = await getAftercareDashboardUser();
  await redirectIncompleteAftercareOnboarding(appUser.orgId);

  const query = await searchParams;
  const { tab } = query;
  const activeTab = isDashboardTab(tab) ? tab : "overview";
  const isEditingDisplayName = activeTab === "account" && query.edit === "displayName";

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
        bedsMen: true,
        bedsMenAvailable: true,
        bedsWomen: true,
        bedsWomenAvailable: true,
        bedsLgbtq: true,
        bedsLgbtqAvailable: true,
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
        profileId: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        profile: { select: { programName: true } }
      }
    }),
    prisma.referral.findMany({
      where: {
        aftercareOrgId: appUser.orgId
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        aftercareProfileId: true,
        status: true,
        caseManagerName: true,
        caseManagerEmail: true,
        caseManagerPhone: true,
        caseManagerOrganization: true,
        clientAgeRange: true,
        supportCategory: true,
        insuranceCategory: true,
        preferredStartWindow: true,
        specialNeeds: true,
        reasonForReferral: true,
        statusUpdatedAt: true,
        createdAt: true,
        aftercareProfile: { select: { programName: true } }
      }
    }),
    prisma.verificationDocument.findMany({
      where: {
        status: "pending",
        profile: { orgId: appUser.orgId }
      },
      select: { profileId: true }
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

  const selectedProfile = profiles.find((profile) => profile.id === query.profileId) ?? null;
  const scopedProfiles = selectedProfile ? [selectedProfile] : profiles;
  const scopedLeads = selectedProfile
    ? leads.filter((lead) => lead.profileId === selectedProfile.id)
    : leads;
  const scopedReferrals = selectedProfile
    ? referrals.filter((referral) => referral.aftercareProfileId === selectedProfile.id)
    : referrals;
  const selectedReferral = scopedReferrals.find((referral) => referral.id === query.referralId) ?? null;
  const openReferrals = scopedReferrals.filter((referral) => !["declined", "placed", "closed"].includes(referral.status));
  const scopedPendingDocumentCount = selectedProfile
    ? pendingDocumentCount.filter((document) => document.profileId === selectedProfile.id).length
    : pendingDocumentCount.length;
  const totalBeds = scopedProfiles.reduce((sum, profile) => sum + (profile.totalBeds ?? 0), 0);
  const availableBeds = scopedProfiles.reduce((sum, profile) => sum + (profile.bedsAvailable ?? 0), 0);
  const newLeadCount = scopedLeads.filter((lead) => lead.status === "new").length;
  const staleAvailabilityCount = scopedProfiles.filter((profile) => {
    const lastUpdated =
      profile.type === "sober_living"
        ? profile.bedsAvailableUpdatedAt
        : profile.acceptingNewPatientsUpdatedAt;

    if (!lastUpdated) {
      return true;
    }

    return Date.now() - lastUpdated.getTime() > 1000 * 60 * 60 * 24 * 7;
  }).length;

  return (
    <main className="shell py-8">
      {selectedReferral ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border bg-white p-5 shadow-xl">
            <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 md:flex-row md:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">Referral details</h2>
                  <Badge tone={["accepted", "placed"].includes(selectedReferral.status) ? "success" : "warning"}>
                    {formatReferralValue(selectedReferral.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedReferral.aftercareProfile.programName} · Submitted {formatDate(selectedReferral.createdAt)} · Updated {formatDate(selectedReferral.statusUpdatedAt)}
                </p>
              </div>
              <Link
                className="focus-ring inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-white px-3 text-xs font-semibold"
                href={selectedProfile ? `/dashboard/aftercare?tab=overview&profileId=${selectedProfile.id}` : "/dashboard/aftercare?tab=overview"}
              >
                Close
              </Link>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-border bg-muted/40 p-4">
                <h3 className="font-semibold">Case manager</h3>
                <dl className="mt-3 grid gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{selectedReferral.caseManagerName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Organization</dt>
                    <dd className="font-medium">{selectedReferral.caseManagerOrganization}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium">{selectedReferral.caseManagerEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{selectedReferral.caseManagerPhone}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-md border border-border bg-muted/40 p-4">
                <h3 className="font-semibold">Referral fit</h3>
                <dl className="mt-3 grid gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Client age range</dt>
                    <dd className="font-medium">{formatReferralValue(selectedReferral.clientAgeRange)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Support category</dt>
                    <dd className="font-medium">{formatReferralValue(selectedReferral.supportCategory)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Insurance category</dt>
                    <dd className="font-medium">{formatReferralValue(selectedReferral.insuranceCategory)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Preferred start window</dt>
                    <dd className="font-medium">{formatReferralValue(selectedReferral.preferredStartWindow)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Special needs/preferences</dt>
                    <dd className="font-medium">
                      {selectedReferral.specialNeeds.length ? selectedReferral.specialNeeds.join(", ") : "None listed"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-border bg-muted/40 p-4">
              <h3 className="font-semibold">Reason for referral</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {selectedReferral.reasonForReferral}
              </p>
            </div>

            {referralActionOptions(selectedReferral.status).length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {referralActionOptions(selectedReferral.status).map(([status, label]) => (
                  <form key={status} action={updateReferralStatus}>
                    <input name="referralId" type="hidden" value={selectedReferral.id} />
                    <button
                      className="focus-ring min-h-10 rounded-md border border-border bg-white px-4 text-sm font-semibold"
                      name="status"
                      value={status}
                    >
                      {label}
                    </button>
                  </form>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">{appUser.organization?.name}</p>
          </div>
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
              <Card>
                <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
                  <div>
                    <h2 className="text-xl font-semibold">Today&apos;s workspace</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Pick a home, update availability, and handle new requests from the same place.
                    </p>
                    <div className="mt-4">
                      <AftercareOverviewSelector
                        profiles={profiles.map((profile) => ({
                          id: profile.id,
                          programName: profile.programName
                        }))}
                        selectedProfileId={selectedProfile?.id}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-md border border-border bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">Open requests</p>
                      <p className="mt-1 text-2xl font-semibold">{openReferrals.length + newLeadCount}</p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">Open referrals</p>
                      <p className="mt-1 text-2xl font-semibold">{openReferrals.length}</p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">Beds available</p>
                      <p className="mt-1 text-2xl font-semibold">{availableBeds}</p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">Availability</p>
                      <p className="mt-1 text-lg font-semibold">
                        {staleAvailabilityCount ? `${staleAvailabilityCount} stale` : "Current"}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedProfile ? (
                <div className="mt-5 border-t border-border pt-5">
                  <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <BedDouble className="text-primary" size={20} />
                        <h2 className="font-semibold">Quick bed update</h2>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Updating {selectedProfile.programName}.
                      </p>
                    </div>
                    <Badge tone={staleAvailabilityCount ? "warning" : "success"}>
                      {staleAvailabilityCount ? "Needs review" : "Availability current"}
                    </Badge>
                  </div>
                  <AftercareQuickAvailability
                    error={query.availabilityError}
                    profile={{
                      id: selectedProfile.id,
                      programName: selectedProfile.programName,
                      type: selectedProfile.type,
                      bedsMen: selectedProfile.bedsMen,
                      bedsMenAvailable: selectedProfile.bedsMenAvailable,
                      bedsWomen: selectedProfile.bedsWomen,
                      bedsWomenAvailable: selectedProfile.bedsWomenAvailable,
                      bedsLgbtq: selectedProfile.bedsLgbtq,
                      bedsLgbtqAvailable: selectedProfile.bedsLgbtqAvailable,
                      acceptingNewPatients: selectedProfile.acceptingNewPatients,
                      availabilityNotes: selectedProfile.availabilityNotes
                    }}
                    updateAction={updateAftercareAvailability}
                  />
                </div>
                ) : (
                  <div className="mt-5 rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                    Select a specific home or program above to update availability. The all-homes view
                    stays read-only so bed changes are not applied to the wrong listing.
                  </div>
                )}
              </Card>

              <Card>
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-xl font-semibold">New requests</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Referrals and public leads that need review.
                    </p>
                  </div>
                  <Badge>{openReferrals.length + newLeadCount} open</Badge>
                </div>
                <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">Referrals</h3>
                      <Badge>{openReferrals.length} open</Badge>
                    </div>
                  {query.referralError ? (
                    <div className="mt-3 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm">
                      {query.referralError}
                    </div>
                  ) : null}
                  {scopedReferrals.length ? (
                    <div className="mt-4 grid gap-2">
                      {scopedReferrals.map((referral) => (
                        <div key={referral.id} className="rounded-md border border-border bg-muted/40 p-2.5 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{referral.caseManagerOrganization}</p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {referral.aftercareProfile.programName} · {formatReferralValue(referral.clientAgeRange)} · {formatReferralValue(referral.preferredStartWindow)}
                              </p>
                            </div>
                            <Badge tone={["accepted", "placed"].includes(referral.status) ? "success" : "warning"}>
                              {formatReferralValue(referral.status)}
                            </Badge>
                          </div>
                          <p className="mt-2 line-clamp-1 text-muted-foreground">
                            {referral.reasonForReferral}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Link
                              className="focus-ring inline-flex min-h-8 items-center rounded-md border border-border bg-white px-2.5 text-xs font-semibold"
                              href={referralDetailHref(referral.id, selectedProfile?.id)}
                            >
                              View referral
                            </Link>
                            {compactReferralActionOptions(referral.status).length ? (
                              <>
                              {compactReferralActionOptions(referral.status).map(([status, label]) => (
                                <form key={status} action={updateReferralStatus}>
                                  <input name="referralId" type="hidden" value={referral.id} />
                                  <button
                                    className="focus-ring min-h-8 rounded-md border border-border bg-white px-2.5 text-xs font-semibold"
                                    name="status"
                                    value={status}
                                  >
                                    {label}
                                  </button>
                                </form>
                              ))}
                              </>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      New referrals will appear here with status actions in the next dashboard phase.
                    </p>
                  )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">Public leads</h3>
                      <Badge>{scopedLeads.length} recent</Badge>
                    </div>
                    {scopedLeads.length ? (
                      <div className="mt-4 grid gap-2">
                        {scopedLeads.map((lead) => (
                          <div key={lead.id} className="rounded-md border border-border bg-muted/40 p-2.5 text-sm">
                            <div className="flex justify-between gap-3">
                              <p className="truncate font-semibold">{lead.name}</p>
                              <Badge tone={lead.status === "new" ? "warning" : "neutral"}>{lead.status}</Badge>
                            </div>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
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
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-xl font-semibold">Availability snapshot</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Scan all homes and spot stale bed counts quickly.
                    </p>
                  </div>
                  <Badge>{availableBeds} of {totalBeds} beds available</Badge>
                </div>
                {scopedProfiles.length ? (
                  <div className="mt-5 grid gap-3">
                    {scopedProfiles.map((profile) => {
                      const visiblePopulationBeds = getVisiblePopulationBeds(profile);
                      const lastUpdated =
                        profile.type === "sober_living"
                          ? profile.bedsAvailableUpdatedAt
                          : profile.acceptingNewPatientsUpdatedAt;

                      return (
                        <div key={profile.id} className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-[1fr_1.4fr_auto] md:items-center">
                          <div>
                            <p className="font-semibold">{profile.programName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{availabilityLabel(profile)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {profile.type === "sober_living" && visiblePopulationBeds.length ? (
                              visiblePopulationBeds.map((bed) => (
                                <span key={bed.label} className="rounded-md border border-border bg-muted/50 px-2 py-1">
                                  {bed.label}: {bed.available}/{bed.total}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-md border border-border bg-muted/50 px-2 py-1">
                                {profile.type === "continued_care"
                                  ? availabilityLabel(profile)
                                  : "Population beds not set"}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            <span className="text-xs text-muted-foreground">{formatDate(lastUpdated)}</span>
                            <Link
                              className="focus-ring inline-flex min-h-8 items-center rounded-md border border-border bg-white px-2.5 text-xs font-semibold"
                              href={`/dashboard/aftercare?tab=overview&profileId=${profile.id}`}
                            >
                              Update
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                    No homes or programs have been created yet.
                  </p>
                )}
              </Card>

              <Card>
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-xl font-semibold">Profile readiness</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Items that can affect visibility, trust, or referral conversion.
                    </p>
                  </div>
                  <Badge tone={scopedPendingDocumentCount || staleAvailabilityCount ? "warning" : "success"}>
                    {scopedPendingDocumentCount || staleAvailabilityCount ? "Needs attention" : "Ready"}
                  </Badge>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-border bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">Profiles shown</p>
                    <p className="mt-1 text-2xl font-semibold">{scopedProfiles.length}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">Pending documents</p>
                    <p className="mt-1 text-2xl font-semibold">{scopedPendingDocumentCount}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">Self-reported listings</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {scopedProfiles.filter((profile) => profile.verificationTier === 1).length}
                    </p>
                  </div>
                </div>
              </Card>
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
                        <th className="py-3 pr-4 font-semibold">Population beds</th>
                        <th className="py-3 pr-4 font-semibold">Readiness</th>
                        <th className="py-3 pr-4 font-semibold">Last update</th>
                        <th className="py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((profile) => {
                        const readiness = profileReadiness(profile);
                        const visiblePopulationBeds = getVisiblePopulationBeds(profile);

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
                            <td className="py-4 pr-4">
                              {profile.type === "sober_living" ? (
                                <div className="grid gap-1 text-xs">
                                  {visiblePopulationBeds.length ? (
                                    visiblePopulationBeds.map((bed) => (
                                      <span key={bed.label}>
                                        {bed.label}: {bed.available}/{bed.total}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground">Not set</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Program availability</span>
                              )}
                            </td>
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
                                  href={`/profiles/${profile.slug}?preview=1`}
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
                  <dt className="text-muted-foreground">Display name</dt>
                  <dd className="mt-1 flex items-center gap-2 font-semibold">
                    <span>{[appUser.firstName, appUser.lastName].filter(Boolean).join(" ") || appUser.email}</span>
                    <Link
                      aria-label="Edit display name"
                      className="focus-ring inline-flex size-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground hover:text-foreground"
                      href="/dashboard/aftercare?tab=account&edit=displayName"
                      title="Edit display name"
                    >
                      <Pencil size={14} />
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Primary email</dt>
                  <dd className="mt-1 font-semibold">{appUser.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Role</dt>
                  <dd className="mt-1 font-semibold">{appUser.role.replaceAll("_", " ")}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email status</dt>
                  <dd className="mt-1 font-semibold">
                    {appUser.emailVerified ? "Verified" : "Not verified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Account status</dt>
                  <dd className="mt-1 font-semibold">{appUser.isActive ? "Active" : "Inactive"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Organization</dt>
                  <dd className="mt-1 font-semibold">{appUser.organization?.name || "Not set"}</dd>
                </div>
              </dl>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Profile picture, password settings, and notification preferences will be added in a
                follow-up pass.
              </p>
              {isEditingDisplayName ? (
                <form action={updateUserDisplayName} className="mt-6 grid gap-4 rounded-md border border-border bg-muted/40 p-4">
                  <h3 className="font-semibold">Update display name</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      First name
                      <input
                        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                        defaultValue={appUser.firstName ?? ""}
                        name="firstName"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Last name
                      <input
                        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                        defaultValue={appUser.lastName ?? ""}
                        name="lastName"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                      Save display name
                    </button>
                    <Link
                      className="focus-ring inline-flex min-h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
                      href="/dashboard/aftercare?tab=account"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              ) : null}
              <div className="mt-6 rounded-md border border-border bg-muted/40 p-4">
                <h3 className="font-semibold">Session</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Sign out of this account on the current device.
                </p>
                <div className="mt-4">
                  <SignOutButton />
                </div>
              </div>
            </Card>
          ) : null}
        </section>
      </div>
    </main>
  );
}
