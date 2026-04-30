import Link from "next/link";
import { BedDouble, ClipboardList, Inbox, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  getAftercareDashboardUser,
  redirectIncompleteAftercareOnboarding
} from "@/lib/protected-routing";

export const dynamic = "force-dynamic";

export default async function AftercareDashboardPage() {
  const appUser = await getAftercareDashboardUser();
  await redirectIncompleteAftercareOnboarding(appUser.orgId);

  const profiles = await prisma.aftercareProfile.findMany({
    where: { orgId: appUser.orgId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      programName: true,
      type: true,
      status: true,
      publicCity: true,
      publicState: true,
      totalBeds: true,
      bedsAvailable: true,
      acceptingNewPatients: true,
      onboardingStep: true,
      onboardingCompletedAt: true,
      updatedAt: true
    }
  });

  const [leadCount, openReferralCount] = await Promise.all([
    prisma.lead.count({ where: { aftercareOrgId: appUser.orgId } }),
    prisma.referral.count({
      where: {
        aftercareOrgId: appUser.orgId,
        status: { in: ["pending", "viewed", "accepted", "waitlisted"] }
      }
    })
  ]);

  const metrics = [
    ["Profiles", profiles.length.toString()],
    ["Open referrals", openReferralCount.toString()],
    ["Public leads", leadCount.toString()],
    ["Availability updates", profiles.filter((profile) => profile.updatedAt).length.toString()]
  ];

  return (
    <main className="shell py-8">
      <Badge tone="verified">Aftercare dashboard</Badge>
      <div className="mt-3 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Provider operations</h1>
          <p className="mt-2 text-sm text-muted-foreground">{appUser.organization?.name}</p>
        </div>
        <Link
          className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          href="/onboarding/aftercare/sober-living/1?new=1"
        >
          Add profile
        </Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Profiles</h2>
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
          <div className="grid gap-3">
            {profiles.map((profile) => (
              <Card key={profile.id}>
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={profile.status === "published" ? "success" : "warning"}>
                        {profile.status}
                      </Badge>
                      <Badge>{profile.type === "sober_living" ? "Sober Living" : "Continued Care"}</Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold">{profile.programName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {profile.publicCity}, {profile.publicState}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 md:items-end">
                    <p className="text-sm text-muted-foreground">
                      {profile.type === "sober_living"
                        ? `${profile.bedsAvailable ?? 0} of ${profile.totalBeds ?? 0} beds available`
                        : profile.acceptingNewPatients
                          ? "Accepting new patients"
                          : "Not accepting patients"}
                    </p>
                    <Link
                      className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold"
                      href={`/dashboard/aftercare/profiles/${profile.id}`}
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <Inbox className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Referral inbox</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Receive de-identified referrals, manage status, and send plan-gated messages.
          </p>
        </Card>
        <Card>
          <BedDouble className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Availability</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sober Living manages beds. Continued Care manages accepting-new-patients status.
          </p>
        </Card>
        <Card>
          <ClipboardList className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Documents</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Upload verification documents to private storage for admin review.
          </p>
        </Card>
        <Card>
          <Users className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Team</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Admins manage team members while enforcing one organization per email.
          </p>
        </Card>
      </div>
    </main>
  );
}
