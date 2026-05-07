import Link from "next/link";
import { Heart, MapPin, Search, Send, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { ProfileType, Role } from "@prisma/client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { referentPlans } from "@/lib/plans";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { prisma } from "@/lib/prisma";
import { maxReferentStep } from "@/lib/referent-onboarding";
import { addReferentTeamMember, removePendingReferentInvite } from "./actions";

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

function planTeamLimit(planKey: string | null | undefined) {
  const plan = planKey && planKey in referentPlans
    ? referentPlans[planKey as keyof typeof referentPlans]
    : referentPlans.starter;

  return plan.teamMembers;
}

export default async function ReferentDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ teamMessage?: string | string[] }>;
}) {
  const query = await searchParams;
  const teamMessage = Array.isArray(query.teamMessage) ? query.teamMessage[0] : query.teamMessage;
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
      onboardingCompletedAt: true,
      invitedTeamEmails: true
    }
  });

  if (!referentDetails?.onboardingCompletedAt) {
    const resumeStep = Math.min(Math.max(referentDetails?.onboardingStep ?? 1, 1), maxReferentStep);
    redirect(`/onboarding/referent/${resumeStep}`);
  }

  const [referrals, favorites, thisMonthReferralCount, organization] = await Promise.all([
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
    }),
    prisma.organization.findUnique({
      where: { id: appUser.orgId },
      select: {
        name: true,
        subscriptionPlan: true,
        users: {
          orderBy: [{ role: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            emailVerified: true
          }
        }
      }
    })
  ]);
  const activeReferralCount = referrals.filter((referral) => !["declined", "placed", "closed"].includes(referral.status)).length;
  const placedReferralCount = referrals.filter((referral) => referral.status === "placed").length;
  const activeTeamMembers = organization?.users.filter((user) => user.isActive) ?? [];
  const pendingInviteEmails = referentDetails.invitedTeamEmails.map((email) => email.toLowerCase());
  const teamLimit = planTeamLimit(organization?.subscriptionPlan);
  const teamUsage = activeTeamMembers.length + pendingInviteEmails.length;
  const canInviteMore = teamLimit === "unlimited" || teamUsage < teamLimit;
  const canManageTeam = appUser.role === Role.referent_admin;

  return (
    <main className="shell py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Badge tone="warning">Referent workspace</Badge>
          <h1 className="mt-3 text-3xl font-semibold">Referral workspace</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Track active referrals and keep a shortlist of providers for placement decisions.
          </p>
          <p className="mt-1 text-sm font-semibold">{organization?.name}</p>
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
          ["Team members", teamUsage.toString()]
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

      <Card className="mt-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <Users className="text-primary" size={24} />
            <h2 className="mt-3 text-xl font-semibold">Referent team</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add coworkers to this organization so they can search, favorite providers, and submit referrals under the same account.
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Plan limit: {teamLimit === "unlimited" ? "Unlimited" : `${teamLimit} team members`} · Current usage: {teamUsage}
            </p>
          </div>
          {teamMessage ? <Badge tone="success">{teamMessage}</Badge> : null}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.65fr)]">
          <div className="overflow-hidden rounded-md border border-border">
            {activeTeamMembers.map((member) => (
              <div
                key={member.id}
                className="grid gap-3 border-b border-border p-3 text-sm last:border-b-0 md:grid-cols-[minmax(0,1fr)_160px_120px] md:items-center"
              >
                <div>
                  <p className="font-semibold">
                    {[member.firstName, member.lastName].filter(Boolean).join(" ") || member.email}
                  </p>
                  <p className="mt-1 text-muted-foreground">{member.email}</p>
                </div>
                <Badge>{member.role.replaceAll("_", " ")}</Badge>
                <Badge tone={member.emailVerified ? "success" : "warning"}>
                  {member.emailVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            ))}
            {pendingInviteEmails.map((email) => (
              <div
                key={email}
                className="grid gap-3 border-b border-border bg-muted/40 p-3 text-sm last:border-b-0 md:grid-cols-[minmax(0,1fr)_160px_120px] md:items-center"
              >
                <div>
                  <p className="font-semibold">{email}</p>
                  <p className="mt-1 text-muted-foreground">Waiting for this person to sign up with this email.</p>
                </div>
                <Badge tone="warning">Pending invite</Badge>
                {canManageTeam ? (
                  <form action={removePendingReferentInvite}>
                    <input name="email" type="hidden" value={email} />
                    <button className="focus-ring min-h-9 rounded-md border border-border px-3 text-sm font-semibold">
                      Remove
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>

          <form action={addReferentTeamMember} className="grid content-start gap-3 rounded-md border border-border bg-muted/40 p-4">
            <h3 className="font-semibold">Add referent</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              This is plan-gated server-side. Stripe enforcement can connect to the same limit later.
            </p>
            <label className="grid gap-2 text-sm font-medium">
              Email address
              <input
                className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                disabled={!canManageTeam || !canInviteMore}
                name="email"
                placeholder="teammate@example.com"
                required
                type="email"
              />
            </label>
            <button
              className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canManageTeam || !canInviteMore}
            >
              Add to account
            </button>
            {!canManageTeam ? (
              <p className="text-xs leading-5 text-muted-foreground">Only referent admins can add team members.</p>
            ) : null}
            {!canInviteMore ? (
              <p className="text-xs leading-5 text-muted-foreground">
                Upgrade the referent plan to add more team members.
              </p>
            ) : null}
          </form>
        </div>
      </Card>
    </main>
  );
}
