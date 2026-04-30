import Link from "next/link";
import {
  BedDouble,
  Building2,
  CalendarClock,
  ClipboardList,
  FileCheck2,
  Inbox,
  MessageSquare,
  ShieldCheck,
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
import { updateAftercareAvailability } from "./actions";

export const dynamic = "force-dynamic";

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
  status: string;
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

export default async function AftercareDashboardPage() {
  const appUser = await getAftercareDashboardUser();
  await redirectIncompleteAftercareOnboarding(appUser.orgId);

  const [profiles, leads, referrals, pendingDocumentCount] = await Promise.all([
    prisma.aftercareProfile.findMany({
      where: { orgId: appUser.orgId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
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
        onboardingCompletedAt: true,
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
    })
  ]);

  const totalBeds = profiles.reduce((sum, profile) => sum + (profile.totalBeds ?? 0), 0);
  const availableBeds = profiles.reduce((sum, profile) => sum + (profile.bedsAvailable ?? 0), 0);
  const openReferralCount = referrals.length;
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
    { label: "Open referrals", value: openReferralCount.toString(), icon: Inbox },
    { label: "New public leads", value: newLeadCount.toString(), icon: MessageSquare }
  ];

  return (
    <main className="shell py-8">
      <Badge tone="verified">Aftercare dashboard</Badge>
      <div className="mt-3 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Provider operations</h1>
          <p className="mt-2 text-sm text-muted-foreground">{appUser.organization?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SignOutButton />
          <Link
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            href="/onboarding/aftercare/sober-living/1?new=1"
          >
            Add profile
          </Link>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
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

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <h2 className="text-xl font-semibold">Operations snapshot</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                PRD v1 focus: keep supply profiles referral-ready, availability fresh, and inbound
                lead/referral work visible.
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
            Profiles can operate as Tier 1 self-reported listings while documents wait for admin
            review. Reviews and ratings stay out of v1.
          </p>
        </Card>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-semibold">Homes and programs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage profile readiness and live availability for each listing.
            </p>
          </div>
          <Badge>{profiles.length} total</Badge>
        </div>
        {profiles.length === 0 ? (
          <Card>
            <h3 className="font-semibold">No aftercare profiles yet</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Create a Sober Living or Continued Care draft profile to start building supply.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {profiles.map((profile) => (
              <Card key={profile.id} className="grid gap-5 lg:grid-cols-[1fr_340px]">
                <div>
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={profile.status === "published" ? "success" : "warning"}>
                        {profile.status}
                      </Badge>
                      <Badge>{profile.type === "sober_living" ? "Sober Living" : "Continued Care"}</Badge>
                      <Badge tone="verified">Tier {profile.verificationTier}</Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold">{profile.programName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {profile.publicCity}, {profile.publicState}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 md:items-end">
                    <p className="text-sm text-muted-foreground">
                      {availabilityLabel(profile)}
                    </p>
                    <Link
                      className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
                      href={`/dashboard/aftercare/profiles/${profile.id}`}
                    >
                      Manage
                    </Link>
                  </div>
                </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Readiness</p>
                      <p className="mt-1 text-sm">
                        {profileReadiness(profile).percent}% complete
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Activity</p>
                      <p className="mt-1 text-sm">
                        {profile._count.referrals} referrals · {profile._count.leads} leads
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Updated</p>
                      <p className="mt-1 text-sm">
                        {formatDate(
                          profile.type === "sober_living"
                            ? profile.bedsAvailableUpdatedAt
                            : profile.acceptingNewPatientsUpdatedAt
                        )}
                      </p>
                    </div>
                  </div>
                  {profile.availabilityNotes ? (
                    <p className="mt-4 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                      {profile.availabilityNotes}
                    </p>
                  ) : null}
                </div>
                <form action={updateAftercareAvailability} className="grid gap-3 rounded-md border border-border bg-muted/40 p-4">
                  <input type="hidden" name="profileId" value={profile.id} />
                  <h4 className="font-semibold">Quick availability</h4>
                  {profile.type === "sober_living" ? (
                    <label className="grid gap-2 text-sm font-medium">
                      Beds available
                      <input
                        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                        defaultValue={profile.bedsAvailable ?? 0}
                        max={profile.totalBeds ?? undefined}
                        min="0"
                        name="bedsAvailable"
                        type="number"
                      />
                    </label>
                  ) : (
                    <label className="grid gap-2 text-sm font-medium">
                      Accepting new patients
                      <select
                        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                        defaultValue={profile.acceptingNewPatients ? "yes" : "no"}
                        name="acceptingNewPatients"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                  )}
                  <label className="grid gap-2 text-sm font-medium">
                    Availability notes
                    <textarea
                      className="min-h-20 rounded-md border border-border bg-white p-3 text-sm"
                      defaultValue={profile.availabilityNotes ?? ""}
                      name="availabilityNotes"
                    />
                  </label>
                  <button className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                    Update availability
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <Inbox className="text-primary" size={24} />
          <div className="mt-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Referral inbox</h2>
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
              New referrals will appear here with status actions: viewed, accept, decline,
              waitlist, placed, and close.
            </p>
          )}
        </Card>
        <Card>
          <MessageSquare className="text-primary" size={24} />
          <div className="mt-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Public leads</h2>
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
              Public profile contact forms will create internal lead records and email notifications.
            </p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <FileCheck2 className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Verification documents</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Upload/review workflows are next. The dashboard already tracks pending document review.
          </p>
        </Card>
        <Card>
          <Users className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Team</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Admins manage team members while enforcing one organization per email.
          </p>
        </Card>
        <Card>
          <ClipboardList className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Launch checklist</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Complete profile details, keep availability fresh, submit verification docs, and respond
            to referrals quickly.
          </p>
        </Card>
      </div>
    </main>
  );
}
