import Link from "next/link";
import Image from "next/image";
import {
  CalendarClock,
  CreditCard,
  Heart,
  MailPlus,
  MapPin,
  Pencil,
  Search,
  Send,
  Settings,
  UserCircle,
  Users,
  X
} from "lucide-react";
import { redirect } from "next/navigation";
import { ProfileType, Role } from "@prisma/client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { billingPlans, formatBillingStatus, formatPlanPrice, getBillingPlan } from "@/lib/billing";
import { canDisplayVerifiedBadge, canReceiveDirectReferrals, getReferentTeamLimit } from "@/lib/feature-gates";
import {
  formatPhoneScreeningDateTime,
  generatePhoneScreeningSlots
} from "@/lib/phone-screening";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { prisma } from "@/lib/prisma";
import { maxReferentStep } from "@/lib/referent-onboarding";
import { cn } from "@/lib/utils";
import { cancelBillingSubscription, changeBillingPlan, createBillingPortalSession } from "../billing/actions";
import {
  inviteReferentManagers,
  bookPhoneScreeningSlot,
  removePendingReferentInvite,
  removeReferentManager,
  updateReferentDisplayName
} from "./actions";

export const dynamic = "force-dynamic";

const dashboardTabs = [
  { key: "overview", label: "Overview", icon: Send },
  { key: "referrals", label: "Referrals", icon: Send },
  { key: "favorites", label: "Favorites", icon: Heart },
  { key: "managers", label: "Managers", icon: Users },
  { key: "subscription", label: "Subscription", icon: CreditCard },
  { key: "account", label: "Account", icon: Settings }
] as const;

type DashboardTab = (typeof dashboardTabs)[number]["key"];

function isDashboardTab(value: string | undefined): value is DashboardTab {
  return dashboardTabs.some((tab) => tab.key === value);
}

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

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(value);
}

function formatBillingDate(value: Date | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(value);
}

function formatPlanLimit(value: number | "unlimited") {
  return value === "unlimited" ? "Unlimited" : value.toString();
}

function planTeamLimit(planKey: string | null | undefined) {
  return getReferentTeamLimit(planKey);
}

export default async function ReferentDashboardPage({
  searchParams
}: {
  searchParams: Promise<{
    tab?: string | string[];
    invite?: string | string[];
    edit?: string | string[];
    teamMessage?: string | string[];
    billingMessage?: string | string[];
    billingView?: string | string[];
    referralMessage?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const tab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const activeTab = isDashboardTab(tab) ? tab : "overview";
  const invite = Array.isArray(query.invite) ? query.invite[0] : query.invite;
  const isInviteManagersOpen = activeTab === "managers" && invite === "1";
  const edit = Array.isArray(query.edit) ? query.edit[0] : query.edit;
  const isEditingDisplayName = activeTab === "account" && edit === "displayName";
  const teamMessage = Array.isArray(query.teamMessage) ? query.teamMessage[0] : query.teamMessage;
  const billingMessage = Array.isArray(query.billingMessage) ? query.billingMessage[0] : query.billingMessage;
  const referralMessage = Array.isArray(query.referralMessage) ? query.referralMessage[0] : query.referralMessage;
  const billingView = Array.isArray(query.billingView) ? query.billingView[0] : query.billingView;
  const isPlanSelectionOpen = activeTab === "subscription" && billingView === "plans";
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
            id: true,
            programName: true,
            slug: true,
            publicCity: true,
            publicState: true,
            ownershipStatus: true,
            verificationTier: true,
            organization: {
              select: {
                type: true,
                subscriptionPlan: true,
                subscriptionStatus: true
              }
            },
            phoneScreeningWindows: {
              where: { isActive: true },
              orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }]
            },
            phoneScreeningAppointments: {
              where: {
                status: "scheduled",
                startsAt: { gte: new Date() }
              },
              select: {
                startsAt: true,
                endsAt: true,
                status: true
              }
            }
          }
        },
        phoneScreeningAppointments: {
          where: { status: "scheduled" },
          orderBy: { startsAt: "asc" },
          take: 1,
          select: {
            startsAt: true,
            timezone: true
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
            verificationTier: true,
            ownershipStatus: true,
            organization: {
              select: {
                type: true,
                subscriptionPlan: true,
                subscriptionStatus: true
              }
            }
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
        subscriptionStatus: true,
        subscriptionBillingCycle: true,
        subscriptionRenewsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
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
  const referentBillingPlan = getBillingPlan("referent", organization?.subscriptionPlan);

  return (
    <main className="shell py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="flex items-start gap-4">
          <Link className="focus-ring inline-flex shrink-0 items-center rounded-md" href="/" aria-label="Aftercare Compass home">
            <Image
              alt="Aftercare Compass"
              className="h-12 w-12 object-contain"
              height={48}
              src="/brand/ac-favicon.png"
              width={48}
            />
          </Link>
          <div>
            <Badge tone="warning">Referent workspace</Badge>
            <h1 className="mt-3 text-3xl font-semibold">Referral workspace</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Track active referrals and keep a shortlist of providers for placement decisions.
            </p>
            <p className="mt-1 text-sm font-semibold">{organization?.name}</p>
          </div>
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

      <nav className="ac-tabs mt-6" aria-label="Referent dashboard sections">
        {dashboardTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;

          return (
            <Link
              key={item.key}
              className="focus-ring ac-tab"
              data-active={isActive ? "true" : "false"}
              href={`/dashboard/referent?tab=${item.key}`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {activeTab === "overview" ? (
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
      ) : null}

      {activeTab === "subscription" && appUser.role === Role.referent_admin ? (
        <Card className="mt-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <h2 className="text-xl font-semibold">Subscription</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Review your current plan and usage.
              </p>
            </div>
            {billingMessage ? <Badge tone="success">{billingMessage}</Badge> : null}
          </div>

          {isPlanSelectionOpen ? (
            <div className="mt-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h3 className="text-lg font-semibold">Compare referent plans</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your current plan is marked below. Choose a monthly or annual billing cycle before changing plans.
                  </p>
                </div>
                <Link className="focus-ring ac-button ac-button--secondary" href="/dashboard/referent?tab=subscription">
                  Back to current plan
                </Link>
              </div>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="border-b border-border bg-surface-secondary text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Team seats</th>
                      <th className="px-4 py-3">Unlocks</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingPlans.referent.map((plan) => {
                      const isCurrentPlan = referentBillingPlan.key === plan.key;

                      return (
                        <tr key={plan.key} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-4 align-top">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{plan.label}</span>
                              {isCurrentPlan ? <Badge tone="success">Current</Badge> : null}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top font-semibold">{formatPlanPrice(plan.monthlyPrice, "monthly")}</td>
                          <td className="px-4 py-4 align-top">{formatPlanLimit(planTeamLimit(plan.key))}</td>
                          <td className="px-4 py-4 align-top text-muted-foreground">
                            <ul className="grid gap-1">
                              {plan.features.map((feature) => (
                                <li key={feature}>{feature}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <form action={changeBillingPlan} className="flex justify-end gap-2">
                              <input name="returnTo" type="hidden" value="/dashboard/referent?tab=subscription" />
                              <input name="plan" type="hidden" value={plan.key} />
                              <select
                                aria-label={`${plan.label} billing cycle`}
                                className="min-h-10 max-w-32 rounded-md border border-border bg-white px-3 text-sm"
                                name="billingCycle"
                                defaultValue={organization?.subscriptionBillingCycle || "monthly"}
                              >
                                <option value="monthly">Monthly</option>
                                <option value="annual">Annual</option>
                              </select>
                              <button className="focus-ring ac-button ac-button--primary min-h-10">
                                {isCurrentPlan ? "Update" : "Choose"}
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
              <div className="ac-card p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current plan</p>
                    <h3 className="mt-1 text-2xl font-semibold">{referentBillingPlan.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatPlanPrice(referentBillingPlan.monthlyPrice, organization?.subscriptionBillingCycle === "annual" ? "annual" : "monthly")}
                    </p>
                  </div>
                  <Badge tone={organization?.subscriptionStatus === "active" ? "success" : "warning"}>
                    {formatBillingStatus(organization?.subscriptionStatus)}
                  </Badge>
                </div>
                <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                  <div className="ac-stat-card p-4">
                    <dt className="text-muted-foreground">Manager seats used</dt>
                    <dd className="mt-1 text-xl font-semibold">
                      {teamUsage} / {formatPlanLimit(planTeamLimit(organization?.subscriptionPlan))}
                    </dd>
                  </div>
                  <div className="ac-stat-card p-4">
                    <dt className="text-muted-foreground">Active referrals</dt>
                    <dd className="mt-1 text-xl font-semibold">{activeReferralCount}</dd>
                  </div>
                  <div className="ac-stat-card p-4">
                    <dt className="text-muted-foreground">Billing cycle</dt>
                    <dd className="mt-1 font-semibold">{organization?.subscriptionBillingCycle || "Not selected"}</dd>
                  </div>
                  <div className="ac-stat-card p-4">
                    <dt className="text-muted-foreground">Renews / ends</dt>
                    <dd className="mt-1 font-semibold">{formatBillingDate(organization?.subscriptionRenewsAt)}</dd>
                  </div>
                </dl>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link className="focus-ring ac-button ac-button--primary" href="/dashboard/referent?tab=subscription&billingView=plans">
                    Upgrade or change plan
                  </Link>
                  {organization?.stripeSubscriptionId ? (
                    <>
                      <form action={createBillingPortalSession}>
                        <input name="returnTo" type="hidden" value="/dashboard/referent?tab=subscription" />
                        <button className="focus-ring ac-button ac-button--secondary">
                          Manage payment method
                        </button>
                      </form>
                      <form action={cancelBillingSubscription}>
                        <input name="returnTo" type="hidden" value="/dashboard/referent?tab=subscription" />
                        <ConfirmSubmitButton
                          className="focus-ring ac-button ac-button--secondary text-destructive"
                          message={`Are you sure? Plan will end on ${formatBillingDate(organization.subscriptionRenewsAt)}.`}
                        >
                          Cancel plan
                        </ConfirmSubmitButton>
                      </form>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="ac-card p-5">
                <h3 className="font-semibold">Upgrade summary</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Higher plans can unlock more team members, referral status tracking, in-app messaging, saved searches, bed alerts, placement collaboration, and enterprise reporting.
                </p>
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {activeTab === "overview" || activeTab === "referrals" || activeTab === "favorites" ? (
        <div className={cn(
          "mt-6 grid gap-4",
          activeTab === "overview" ? "xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]" : "xl:grid-cols-1"
        )}>
        {activeTab === "overview" || activeTab === "referrals" ? (
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
          {referralMessage ? (
            <div className="mt-4 rounded-md border border-border bg-surface p-3 text-sm font-semibold">
              {referralMessage}
            </div>
          ) : null}
          {referrals.length ? (
            <div className="mt-5 overflow-hidden rounded-md border border-border">
              {referrals.map((referral) => {
                const bookedScreening = referral.phoneScreeningAppointments[0] ?? null;
                const canBookScreening =
                  referral.status === "accepted" &&
                  !bookedScreening &&
                  canReceiveDirectReferrals(referral.aftercareProfile.organization, referral.aftercareProfile);
                const slots = canBookScreening
                  ? generatePhoneScreeningSlots({
                      windows: referral.aftercareProfile.phoneScreeningWindows,
                      appointments: referral.aftercareProfile.phoneScreeningAppointments,
                      maxSlots: 5
                    })
                  : [];

                return (
                <div
                  key={referral.id}
                  className="grid gap-3 border-b border-border p-3 text-sm last:border-b-0 md:grid-cols-[minmax(0,1.2fr)_160px_minmax(0,1fr)_minmax(160px,0.8fr)] md:items-center"
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
                    {bookedScreening ? (
                      <div className="rounded-md border border-border bg-white p-2 text-left">
                        <p className="flex items-center gap-1 font-semibold text-foreground">
                          <CalendarClock size={14} />
                          Screening booked
                        </p>
                        <p className="mt-1">{formatPhoneScreeningDateTime(bookedScreening.startsAt, bookedScreening.timezone)}</p>
                      </div>
                    ) : canBookScreening && slots.length ? (
                      <form action={bookPhoneScreeningSlot} className="grid gap-2 text-left">
                        <input name="referralId" type="hidden" value={referral.id} />
                        <select className="min-h-9 rounded-md border border-border bg-white px-2 text-xs" name="slot" required>
                          {slots.map((slot) => (
                            <option key={slot.startsAt.toISOString()} value={slot.startsAt.toISOString()}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                        <button className="focus-ring min-h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
                          Book call
                        </button>
                      </form>
                    ) : (
                      referral.statusUpdatedAt.toLocaleDateString()
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <p className="ac-panel-card mt-5 p-4 text-sm leading-6 text-muted-foreground">
              No referrals yet. Search published profiles and use Place Client to submit the first one.
            </p>
          )}
          </Card>
        ) : null}

        {activeTab === "overview" || activeTab === "favorites" ? (
          <Card>
          <Heart className="text-primary" size={24} />
          <h2 className="mt-3 text-xl font-semibold">Favorites</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your saved provider shortlist.
          </p>
          {favorites.length ? (
            <div className="mt-4 grid gap-3">
              {favorites.map((favorite) => {
                const favoriteShowsVerifiedBadge = canDisplayVerifiedBadge(
                  favorite.profile.organization,
                  favorite.profile
                );

                return (
                <div key={favorite.id} className="ac-panel-card p-3 text-sm">
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
                    <Badge tone={favoriteShowsVerifiedBadge ? "verified" : "neutral"}>
                      {favoriteShowsVerifiedBadge ? "Verified" : "Self-reported"}
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
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Keep a working shortlist of aftercare providers from search results.
            </p>
          )}
          </Card>
        ) : null}
        </div>
      ) : null}

      {activeTab === "managers" ? (
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
          <div className="flex flex-wrap items-center gap-2">
            {teamMessage ? <Badge tone="success">{teamMessage}</Badge> : null}
            {canManageTeam ? (
              <Link
                className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                href="/dashboard/referent?tab=managers&invite=1"
              >
                <MailPlus size={16} />
                Invite managers
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="overflow-hidden rounded-md border border-border">
            {activeTeamMembers.map((member) => (
              <div
                key={member.id}
                className="grid gap-3 border-b border-border p-3 text-sm last:border-b-0 md:grid-cols-[minmax(0,1fr)_160px_120px_auto] md:items-center"
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
                {canManageTeam && member.role === Role.referent_manager && member.id !== appUser.id ? (
                  <form action={removeReferentManager}>
                    <input name="managerId" type="hidden" value={member.id} />
                    <ConfirmSubmitButton
                      className="focus-ring min-h-9 rounded-md border border-border bg-white px-3 text-sm font-semibold text-destructive"
                      message={`Remove ${[member.firstName, member.lastName].filter(Boolean).join(" ") || member.email} from this account? They will lose access to this organization's dashboard.`}
                    >
                      Remove
                    </ConfirmSubmitButton>
                  </form>
                ) : <span />}
              </div>
            ))}
            {pendingInviteEmails.map((email) => (
              <div
                key={email}
                className="grid gap-3 border-b border-border bg-surface-secondary/50 p-3 text-sm last:border-b-0 md:grid-cols-[minmax(0,1fr)_160px_120px] md:items-center"
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
        </div>
      </Card>
      ) : null}

      {activeTab === "account" ? (
        <Card className="mt-6">
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
                  href="/dashboard/referent?tab=account&edit=displayName"
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
              <dd className="mt-1 font-semibold">{appUser.emailVerified ? "Verified" : "Not verified"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Account status</dt>
              <dd className="mt-1 font-semibold">{appUser.isActive ? "Active" : "Inactive"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Organization</dt>
              <dd className="mt-1 font-semibold">{organization?.name || "Not set"}</dd>
            </div>
          </dl>

          {isEditingDisplayName ? (
            <form action={updateReferentDisplayName} className="ac-panel-card mt-6 grid gap-4 p-4">
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
                  href="/dashboard/referent?tab=account"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : null}

          <div className="ac-panel-card mt-6 p-4">
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

      {isInviteManagersOpen ? (
        <div className="ac-modal-overlay">
          <div className="ac-modal max-w-xl p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <span className="ac-modal-icon">
                  <MailPlus size={24} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">Invite managers</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Add one or more emails. Managers will join this referent account when they sign up with an invited email.
                  </p>
                </div>
              </div>
              <Link
                aria-label="Close invite managers"
                className="focus-ring ac-modal-close"
                href="/dashboard/referent?tab=managers"
              >
                <X size={18} />
              </Link>
            </div>
            <form action={inviteReferentManagers} className="mt-5 grid gap-4">
              {teamMessage ? (
                <p className="ac-callout p-3 text-sm font-semibold text-foreground">
                  {teamMessage}
                </p>
              ) : null}
              <label className="grid gap-2 text-sm font-medium">
                Email addresses
                <textarea
                  className="min-h-36 rounded-md border border-border bg-white px-3 py-2 text-sm"
                  disabled={!canManageTeam || !canInviteMore}
                  name="emails"
                  placeholder={"teammate@example.com\ncase.manager@example.com"}
                  required
                />
              </label>
              <p className="text-xs leading-5 text-muted-foreground">
                Separate emails with commas, spaces, or new lines. Paid plan limits are checked before invites are saved.
              </p>
              {!canInviteMore ? (
                <p className="ac-callout p-3 text-sm font-semibold">
                  Upgrade the referent plan to add more team members.
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Link
                  className="focus-ring ac-button ac-button--secondary"
                  href="/dashboard/referent?tab=managers"
                >
                  Cancel
                </Link>
                <button
                  className="focus-ring ac-button ac-button--primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canManageTeam || !canInviteMore}
                >
                  Invite to Aftercare Compass
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
