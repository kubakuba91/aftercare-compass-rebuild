import Link from "next/link";
import { Heart, MapPin, Search, Send } from "lucide-react";
import { redirect } from "next/navigation";
import { ProfileType, Role } from "@prisma/client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { prisma } from "@/lib/prisma";
import { maxReferentStep } from "@/lib/referent-onboarding";

export const dynamic = "force-dynamic";

function formatReferralValue(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAvailability(profile: {
  type: ProfileType;
  bedsAvailable: number | null;
  acceptingNewPatients: boolean | null;
}) {
  if (profile.type === ProfileType.sober_living) {
    return `${profile.bedsAvailable ?? 0} beds available`;
  }

  return profile.acceptingNewPatients ? "Accepting new patients" : "Not accepting patients";
}

function formatPricePerWeek(value: number | null) {
  return value ? `$${value}/week` : "Price not listed";
}

export default async function ReferentDashboardPage() {
  const appUser = await getProtectedAppUser("/dashboard/referent");

  if (appUser.role !== Role.referent_admin && appUser.role !== Role.referent_manager) {
    redirect("/dashboard");
  }

  if (!appUser.orgId) {
    redirect("/onboarding/account-type");
  }

  const referentDetails = await prisma.referentOrganization.findUnique({
    where: { orgId: appUser.orgId },
    select: {
      onboardingStep: true,
      onboardingCompletedAt: true
    }
  });

  if (!referentDetails?.onboardingCompletedAt) {
    const resumeStep = Math.min(Math.max(referentDetails?.onboardingStep ?? 1, 1), maxReferentStep);
    redirect(`/onboarding/referent/${resumeStep}`);
  }

  const [referrals, favorites, thisMonthReferralCount] = await Promise.all([
    prisma.referral.findMany({
      where: { referentOrgId: appUser.orgId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        caseManagerName: true,
        clientAgeRange: true,
        supportCategory: true,
        insuranceCategory: true,
        preferredStartWindow: true,
        reasonForReferral: true,
        createdAt: true,
        statusUpdatedAt: true,
        aftercareProfile: {
          select: {
            programName: true,
            slug: true,
            publicCity: true,
            publicState: true
          }
        }
      }
    }),
    prisma.favorite.findMany({
      where: { orgId: appUser.orgId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            slug: true,
            programName: true,
            type: true,
            publicCity: true,
            publicState: true,
            bedsAvailable: true,
            acceptingNewPatients: true,
            pricePerWeek: true,
            verificationTier: true
          }
        }
      }
    }),
    prisma.referral.count({
      where: {
        referentOrgId: appUser.orgId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })
  ]);
  const activeReferralCount = referrals.filter((referral) => !["declined", "placed", "closed"].includes(referral.status)).length;
  const placedReferralCount = referrals.filter((referral) => referral.status === "placed").length;

  return (
    <main className="shell py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Badge tone="warning">Referent workspace</Badge>
          <h1 className="mt-3 text-3xl font-semibold">Referral workspace</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Track active referrals and keep a shortlist of providers for placement decisions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            href="/search"
          >
            <Search size={16} />
            Search providers
          </Link>
          <SignOutButton />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {[
          ["Active referrals", activeReferralCount.toString()],
          ["This month", thisMonthReferralCount.toString()],
          ["Favorites", favorites.length.toString()],
          ["Placed", placedReferralCount.toString()]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <Card>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <Send className="text-primary" size={24} />
              <h2 className="mt-3 text-xl font-semibold">Recent referrals</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Submitted referrals from your organization.
              </p>
            </div>
            <Link
              className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              href="/search"
            >
              Start referral
            </Link>
          </div>
          {referrals.length ? (
            <div className="mt-5 overflow-hidden rounded-md border border-border">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="grid gap-3 border-b border-border p-3 text-sm last:border-b-0 md:grid-cols-[minmax(0,1.2fr)_160px_minmax(0,1fr)_110px] md:items-center"
                >
                  <div>
                    <Link className="font-semibold underline-offset-4 hover:underline" href={`/profiles/${referral.aftercareProfile.slug}`}>
                        {referral.aftercareProfile.programName}
                    </Link>
                    <p className="mt-1 text-muted-foreground">
                      {[referral.aftercareProfile.publicCity, referral.aftercareProfile.publicState].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div>
                    <Badge tone={["accepted", "placed"].includes(referral.status) ? "success" : "warning"}>
                      {formatReferralValue(referral.status)}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    {formatReferralValue(referral.clientAgeRange)} · {formatReferralValue(referral.supportCategory)} · {formatReferralValue(referral.preferredStartWindow)}
                    <p className="mt-1 line-clamp-1">{referral.reasonForReferral}</p>
                  </div>
                  <div className="text-xs text-muted-foreground md:text-right">
                    {referral.statusUpdatedAt.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
              No referrals yet. Search published profiles and use Place Client to submit the first one.
            </p>
          )}
        </Card>

        <Card>
          <Heart className="text-primary" size={24} />
          <h2 className="mt-3 text-xl font-semibold">Favorites</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your saved provider shortlist.
          </p>
          {favorites.length ? (
            <div className="mt-4 grid gap-3">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <Link
                        className="font-semibold underline-offset-4 hover:underline"
                        href={`/profiles/${favorite.profile.slug}`}
                      >
                        {favorite.profile.programName}
                      </Link>
                      <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                        <MapPin size={14} />
                        {[favorite.profile.publicCity, favorite.profile.publicState].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <Badge tone={favorite.profile.verificationTier > 1 ? "verified" : "neutral"}>
                      {favorite.profile.verificationTier > 1 ? "Verified" : "Self-reported"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{favorite.profile.type === ProfileType.sober_living ? "Sober Living" : "Continued Care"}</Badge>
                    <Badge tone={favorite.profile.bedsAvailable || favorite.profile.acceptingNewPatients ? "success" : "warning"}>
                      {formatAvailability(favorite.profile)}
                    </Badge>
                    <Badge>{formatPricePerWeek(favorite.profile.pricePerWeek)}</Badge>
                  </div>
                  <Link
                    className="mt-3 inline-flex text-sm font-semibold text-primary"
                    href={`/profiles/${favorite.profile.slug}`}
                  >
                    View profile
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Keep a working shortlist of aftercare providers from search results.
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}
