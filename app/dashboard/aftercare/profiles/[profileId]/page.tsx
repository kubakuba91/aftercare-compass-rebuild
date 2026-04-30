import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BedDouble, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  getAftercareDashboardUser,
  redirectIncompleteAftercareOnboarding
} from "@/lib/protected-routing";

export default async function AftercareProfileDetailPage({
  params
}: {
  params: Promise<{ profileId: string }>;
}) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare");
  await redirectIncompleteAftercareOnboarding(appUser.orgId);

  const { profileId } = await params;
  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: profileId,
      orgId: appUser.orgId ?? undefined
    },
    include: {
      leads: { select: { id: true }, take: 1 },
      referrals: { select: { id: true }, take: 1 },
      certifications: { select: { id: true, status: true } }
    }
  });

  if (!profile) {
    notFound();
  }

  const isSoberLiving = profile.type === "sober_living";
  const publicLocation = [profile.publicCity, profile.publicState].filter(Boolean).join(", ");
  const privateAddress = [profile.streetAddress, profile.city, profile.state, profile.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="shell py-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" href="/dashboard/aftercare">
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <div className="mt-5 flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={profile.status === "published" ? "success" : "warning"}>{profile.status}</Badge>
            <Badge>{isSoberLiving ? "Sober Living" : "Continued Care"}</Badge>
            <Badge tone="verified">Tier {profile.verificationTier}</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold">{profile.programName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Public location: {publicLocation || "Not set"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          <Card>
            {isSoberLiving ? <BedDouble className="text-primary" size={24} /> : <Building2 className="text-primary" size={24} />}
            <h2 className="mt-3 text-xl font-semibold">Availability</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isSoberLiving
                ? `${profile.bedsAvailable ?? 0} beds available out of ${profile.totalBeds ?? 0} total.`
                : profile.acceptingNewPatients
                  ? "This program is accepting new patients."
                  : "This program is not currently accepting new patients."}
            </p>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Profile overview</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {profile.description || "No description added yet."}
            </p>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Private operations data</h2>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Street address</dt>
                <dd className="font-medium">{privateAddress || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Admissions email</dt>
                <dd className="font-medium">{profile.admissionsContactEmail || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Admissions phone</dt>
                <dd className="font-medium">{profile.admissionsContactPhone || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Population</dt>
                <dd className="font-medium">
                  {profile.populationServedOptions.length
                    ? profile.populationServedOptions.join(", ")
                    : profile.populationServed || "Not set"}
                </dd>
              </div>
            </dl>
          </Card>
        </section>

        <aside className="grid h-fit gap-4">
          <Card>
            <h2 className="font-semibold">Readiness</h2>
            <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <li>Photos required before publishing</li>
              <li>Subscription check pending</li>
              <li>Verification documents pending</li>
              <li>No reviews or ratings in v1</li>
            </ul>
          </Card>
          <Card>
            <h2 className="font-semibold">Activity</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Leads</dt>
                <dd className="font-semibold">{profile.leads.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Referrals</dt>
                <dd className="font-semibold">{profile.referrals.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Documents</dt>
                <dd className="font-semibold">{profile.certifications.length}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </main>
  );
}
