import Link from "next/link";
import Image from "next/image";
import {
  BedDouble,
  Building2,
  CalendarClock,
  CreditCard,
  Home,
  Info,
  LockKeyhole,
  MailPlus,
  Pencil,
  Settings,
  TrendingDown,
  TrendingUp,
  UserCircle,
  Users,
  X
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AftercareOverviewSelector } from "@/components/dashboard/aftercare-overview-selector";
import { AftercareQuickAvailability } from "@/components/dashboard/aftercare-quick-availability";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  RowActionsMenu,
  RowActionsMenuButton,
  RowActionsMenuDivider,
  RowActionsMenuLabel,
  RowActionsMenuLink
} from "@/components/ui/row-actions-menu";
import { billingPlans, formatBillingStatus, getBillingPlan, getBillingPlansWithStripePrices } from "@/lib/billing";
import { getVisiblePopulationBeds } from "@/lib/bed-display";
import {
  canReceiveDirectReferrals,
  canUseLiveAvailability,
  canUseOperationalAnalytics,
  canUsePlacementTracking,
  getAftercarePlan
} from "@/lib/feature-gates";
import { formatPhoneForDisplay } from "@/lib/phone";
import {
  formatPhoneScreeningDateTime,
  formatPhoneScreeningWindow,
  phoneScreeningDayOptions
} from "@/lib/phone-screening";
import { prisma } from "@/lib/prisma";
import {
  getAftercareDashboardUser,
  redirectIncompleteAftercareOnboarding
} from "@/lib/protected-routing";
import { cn } from "@/lib/utils";
import {
  inviteAftercareManagers,
  addPhoneScreeningWindow,
  deletePhoneScreeningWindow,
  removeAftercareManager,
  removeAftercareManagerInvite,
  sendBedAvailabilityTextCheck,
  updateAftercareProfileStatusFromDashboard,
  updateAftercareAvailability,
  updateManagerSmsSettings,
  updateReferralStatus,
  updateUserDisplayName
} from "./actions";
import { cancelBillingSubscription, changeBillingPlan, createBillingPortalSession } from "../billing/actions";

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

function currentAftercarePlan(planKey: string | null | undefined) {
  return getAftercarePlan(planKey);
}

function canAddAnotherProfile(planKey: string | null | undefined, currentProfileCount: number) {
  const limit = currentAftercarePlan(planKey).profiles;

  return limit === "unlimited" || currentProfileCount < limit;
}

function nextProfileCapacityPlan(planKey: string | null | undefined, currentProfileCount: number) {
  const currentPlan = getBillingPlan("aftercare", planKey);
  const currentPlanIndex = billingPlans.aftercare.findIndex((plan) => plan.key === currentPlan.key);
  const candidatePlans = billingPlans.aftercare.slice(Math.max(currentPlanIndex + 1, 0));

  return candidatePlans.find((plan) => {
    const limit = currentAftercarePlan(plan.key).profiles;

    return limit === "unlimited" || currentProfileCount < limit;
  }) ?? null;
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

function referralActionOptions(status: string, allowPlacementTracking: boolean) {
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
      ...(allowPlacementTracking ? [["placed", "Mark placed"]] : []),
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

function compactReferralActionOptions(status: string, allowPlacementTracking: boolean) {
  if (status === "pending" || status === "viewed") {
    return [
      ["accepted", "Accept"],
      ["waitlisted", "Waitlist"]
    ];
  }

  if (status === "accepted") {
    return allowPlacementTracking ? [["placed", "Mark placed"]] : [];
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

type AnalyticsWindow = 7 | 14 | 30;

function parseAnalyticsWindow(value: string | undefined): AnalyticsWindow {
  if (value === "7" || value === "14") {
    return Number(value) as AnalyticsWindow;
  }

  return 30;
}

function overviewAnalyticsHref(profileId: string | undefined, days: AnalyticsWindow) {
  const params = new URLSearchParams({
    tab: "overview",
    analyticsWindow: String(days)
  });

  if (profileId) {
    params.set("profileId", profileId);
  }

  return `/dashboard/aftercare?${params.toString()}`;
}

function profileBedStats(profile: {
  type: string;
  totalBeds: number | null;
  bedsAvailable: number | null;
  bedsMen: number | null;
  bedsMenAvailable: number | null;
  bedsWomen: number | null;
  bedsWomenAvailable: number | null;
  bedsLgbtq: number | null;
  bedsLgbtqAvailable: number | null;
}): { total: number; available: number } {
  if (profile.type !== "sober_living") {
    return { total: 0, available: 0 };
  }

  const populationBeds = [
    { total: profile.bedsMen, available: profile.bedsMenAvailable },
    { total: profile.bedsWomen, available: profile.bedsWomenAvailable },
    { total: profile.bedsLgbtq, available: profile.bedsLgbtqAvailable }
  ].filter((bed) => (bed.total ?? 0) > 0);

  if (populationBeds.length) {
    return populationBeds.reduce<{ total: number; available: number }>(
      (totals, bed) => {
        const total = bed.total ?? 0;
        const available = Math.min(Math.max(bed.available ?? 0, 0), total);

        return {
          total: totals.total + total,
          available: totals.available + available
        };
      },
      { total: 0, available: 0 }
    );
  }

  const total = profile.totalBeds ?? 0;
  return {
    total,
    available: Math.min(Math.max(profile.bedsAvailable ?? 0, 0), total)
  };
}

function aggregateBedStats(
  profiles: Array<Parameters<typeof profileBedStats>[0]>
): { total: number; available: number } {
  return profiles.reduce(
    (totals, profile) => {
      const profileTotals = profileBedStats(profile);

      return {
        total: totals.total + profileTotals.total,
        available: totals.available + profileTotals.available
      };
    },
    { total: 0, available: 0 }
  );
}

function referralWindowComparison(
  referrals: Array<{ createdAt: Date }>,
  days: AnalyticsWindow
) {
  const now = Date.now();
  const windowMs = days * 24 * 60 * 60 * 1000;
  const currentStart = now - windowMs;
  const previousStart = now - windowMs * 2;

  const current = referrals.filter((referral) => referral.createdAt.getTime() >= currentStart).length;
  const previous = referrals.filter((referral) => {
    const createdAt = referral.createdAt.getTime();

    return createdAt >= previousStart && createdAt < currentStart;
  }).length;

  if (previous === 0) {
    return {
      current,
      previous,
      percentChange: current > 0 ? 100 : 0
    };
  }

  return {
    current,
    previous,
    percentChange: Math.round(((current - previous) / previous) * 100)
  };
}

function formatPercentChange(value: number) {
  if (value > 0) {
    return `+${value}%`;
  }

  return `${value}%`;
}

function AnalyticsMetricCard({
  label,
  value,
  detail,
  locked,
  trend
}: {
  label: string;
  value: string | number;
  detail: string;
  locked?: boolean;
  trend?: "up" | "down" | "flat";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

  return (
    <div className={cn("ac-metric-card relative overflow-hidden p-4", locked ? "bg-surface-secondary" : null)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {locked ? <LockKeyhole className="text-muted-foreground" size={16} /> : null}
        {!locked && TrendIcon ? (
          <TrendIcon
            className={trend === "up" ? "text-success" : "text-danger"}
            size={16}
          />
        ) : null}
      </div>
      <p className={cn("mt-3 text-3xl font-semibold tracking-tight", locked ? "text-muted-foreground" : null)}>
        {locked ? "Locked" : value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {locked ? "Upgrade to Professional to unlock." : detail}
      </p>
    </div>
  );
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
    screeningMessage?: string;
    invite?: string;
    managerMessage?: string;
    billingMessage?: string;
    billingView?: string;
    homesMessage?: string;
    analyticsWindow?: string;
  }>;
}) {
  const appUser = await getAftercareDashboardUser();
  await redirectIncompleteAftercareOnboarding(appUser.orgId);

  const query = await searchParams;
  const { tab } = query;
  const activeTab = isDashboardTab(tab) ? tab : "overview";
  const isEditingDisplayName = activeTab === "account" && query.edit === "displayName";
  const isInviteManagersOpen = activeTab === "managers" && query.invite === "1";
  const isPlanSelectionOpen = activeTab === "subscription" && query.billingView === "plans";
  const billingMessage = Array.isArray(query.billingMessage) ? query.billingMessage[0] : query.billingMessage;
  const homesMessage = Array.isArray(query.homesMessage) ? query.homesMessage[0] : query.homesMessage;

  const [profiles, leads, referrals, pendingDocumentCount, managers, pendingManagerInvites] = await Promise.all([
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
        ownershipStatus: true,
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
        phoneScreeningWindows: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
          select: {
            id: true,
            dayOfWeek: true,
            startMinute: true,
            endMinute: true,
            slotMinutes: true,
            timezone: true
          }
        },
        phoneScreeningAppointments: {
          where: {
            status: "scheduled",
            startsAt: { gte: new Date() }
          },
          orderBy: { startsAt: "asc" },
          take: 5,
          select: {
            id: true,
            startsAt: true,
            timezone: true,
            referral: {
              select: {
                caseManagerName: true,
                caseManagerOrganization: true
              }
            }
          }
        },
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
      take: 200,
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
        aftercareProfile: { select: { programName: true } },
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
        phone: true,
        smsOptIn: true,
        updatedAt: true
      }
    }),
    prisma.organizationInvite.findMany({
      where: {
        orgId: appUser.orgId,
        status: "pending",
        role: "aftercare_manager"
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    })
  ]);

  const planCountedProfiles = profiles.filter((profile) => profile.status !== "unpublished");
  const aftercareBillingPlans = await getBillingPlansWithStripePrices("aftercare");
  const selectedProfile = profiles.find((profile) => profile.id === query.profileId) ?? null;
  const scopedProfiles = selectedProfile ? [selectedProfile] : planCountedProfiles;
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
  const liveAvailabilityProfiles = scopedProfiles.filter(
    (profile) => profile.type !== "sober_living" || canUseLiveAvailability(appUser.organization, profile)
  );
  const totalBeds = liveAvailabilityProfiles.reduce((sum, profile) => sum + (profile.totalBeds ?? 0), 0);
  const availableBeds = liveAvailabilityProfiles.reduce((sum, profile) => sum + (profile.bedsAvailable ?? 0), 0);
  const newLeadCount = scopedLeads.filter((lead) => lead.status === "new").length;
  const analyticsWindow = parseAnalyticsWindow(query.analyticsWindow);
  const operationalAnalyticsUnlocked = canUseOperationalAnalytics(appUser.organization);
  const scopedBedStats = aggregateBedStats(scopedProfiles);
  const occupiedBeds = Math.max(scopedBedStats.total - scopedBedStats.available, 0);
  const occupancyRate = scopedBedStats.total
    ? Math.round((occupiedBeds / scopedBedStats.total) * 100)
    : null;
  const referralAnalytics = referralWindowComparison(scopedReferrals, analyticsWindow);
  const referralTrend =
    referralAnalytics.percentChange > 0
      ? "up"
      : referralAnalytics.percentChange < 0
        ? "down"
        : "flat";
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
  const smsEnabledManagers = managers.filter((manager) => manager.isActive && manager.smsOptIn && manager.phone);
  const aftercareManagerLimit = currentAftercarePlan(appUser.organization?.subscriptionPlan).managers;
  const aftercareManagerUsage = managers.filter((manager) => manager.isActive).length + pendingManagerInvites.length;
  const canInviteMoreManagers = aftercareManagerLimit === "unlimited" || aftercareManagerUsage < aftercareManagerLimit;
  const allowPlacementTracking = canUsePlacementTracking(appUser.organization);
  const selectedProfileCanUseLiveAvailability = selectedProfile
    ? canUseLiveAvailability(appUser.organization, selectedProfile)
    : false;
  const selectedProfileCanUsePhoneScreening = selectedProfile
    ? canReceiveDirectReferrals(appUser.organization, selectedProfile)
    : false;
  const liveBedCountLockedMessage = "upgrade plan to unlock live bed count";
  const canAddProfiles = canAddAnotherProfile(appUser.organization?.subscriptionPlan, planCountedProfiles.length);
  const nextProfilePlan = nextProfileCapacityPlan(appUser.organization?.subscriptionPlan, planCountedProfiles.length);
  const aftercareBillingPlan = getBillingPlan("aftercare", appUser.organization?.subscriptionPlan);
  const aftercareBillingCycle = appUser.organization?.subscriptionBillingCycle === "annual" ? "annual" : "monthly";
  const aftercareCurrentPriceLabel =
    aftercareBillingPlans.find((plan) => plan.key === aftercareBillingPlan.key)?.priceLabels[aftercareBillingCycle] ?? "Custom";

  return (
    <main className="shell py-8">
      {selectedReferral ? (
        <div className="ac-modal-overlay px-4 py-6">
          <div className="ac-modal max-w-3xl p-6 md:p-7">
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
                aria-label="Close referral details"
                className="focus-ring ac-modal-close"
                href={selectedProfile ? `/dashboard/aftercare?tab=overview&profileId=${selectedProfile.id}` : "/dashboard/aftercare?tab=overview"}
              >
                <X size={18} />
              </Link>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <h3 className="font-semibold">Case manager</h3>
                <dl className="mt-3 grid gap-3 text-sm">
                  <div>
                    <dt className="font-semibold">Name</dt>
                    <dd className="mt-1 text-muted-foreground">{selectedReferral.caseManagerName}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Organization</dt>
                    <dd className="mt-1 text-muted-foreground">{selectedReferral.caseManagerOrganization}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Email</dt>
                    <dd className="mt-1 break-words text-muted-foreground">{selectedReferral.caseManagerEmail}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Phone</dt>
                    <dd className="mt-1 text-muted-foreground">{selectedReferral.caseManagerPhone}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold">Referral fit</h3>
                <dl className="mt-3 grid gap-3 text-sm">
                  <div>
                    <dt className="font-semibold">Client age range</dt>
                    <dd className="mt-1 text-muted-foreground">{formatReferralValue(selectedReferral.clientAgeRange)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Support category</dt>
                    <dd className="mt-1 text-muted-foreground">{formatReferralValue(selectedReferral.supportCategory)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Insurance category</dt>
                    <dd className="mt-1 text-muted-foreground">{formatReferralValue(selectedReferral.insuranceCategory)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Preferred start window</dt>
                    <dd className="mt-1 text-muted-foreground">{formatReferralValue(selectedReferral.preferredStartWindow)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Special needs/preferences</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {selectedReferral.specialNeeds.length ? selectedReferral.specialNeeds.join(", ") : "None listed"}
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>

            <Card className="mt-4 p-5">
              <h3 className="font-semibold">Reason for referral</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {selectedReferral.reasonForReferral}
              </p>
            </Card>

            {referralActionOptions(selectedReferral.status, allowPlacementTracking).length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {referralActionOptions(selectedReferral.status, allowPlacementTracking).map(([status, label]) => (
                  <form key={status} action={updateReferralStatus}>
                    <input name="referralId" type="hidden" value={selectedReferral.id} />
                    <button
                      className="focus-ring ac-button ac-button--secondary"
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
            <h1 className="text-3xl font-semibold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">{appUser.organization?.name}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit">
          <nav className="ac-tabs ac-tabs--vertical w-full" aria-label="Aftercare dashboard sections">
            {dashboardTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <Link
                  key={item.key}
                  className="focus-ring ac-tab"
                  data-active={isActive ? "true" : "false"}
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
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-xl font-semibold">Analytics snapshot</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {selectedProfile
                        ? `Showing ${selectedProfile.programName}.`
                        : "Showing all active homes and programs."}
                    </p>
                  </div>
                  <div className="inline-flex w-fit rounded-full bg-surface-secondary p-1 text-xs font-semibold">
                    {([7, 14, 30] as const).map((days) => (
                      <Link
                        key={days}
                        className={cn(
                          "focus-ring rounded-full px-3 py-1.5 transition",
                          analyticsWindow === days
                            ? "bg-surface text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        href={overviewAnalyticsHref(selectedProfile?.id, days)}
                      >
                        {days}d
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <AnalyticsMetricCard
                    detail={
                      occupancyRate === null
                        ? "No bed-based profiles in this view yet."
                        : `${occupiedBeds} occupied of ${scopedBedStats.total} total beds.`
                    }
                    label="Occupancy rate"
                    locked={!operationalAnalyticsUnlocked}
                    value={occupancyRate === null ? "N/A" : `${occupancyRate}%`}
                  />
                  <AnalyticsMetricCard
                    detail={`${referralAnalytics.current} referrals in the last ${analyticsWindow} days vs ${referralAnalytics.previous} previous.`}
                    label="Referral activity"
                    locked={!operationalAnalyticsUnlocked}
                    trend={referralTrend}
                    value={formatPercentChange(referralAnalytics.percentChange)}
                  />
                  <AnalyticsMetricCard
                    detail={`${openReferrals.length} referrals and ${newLeadCount} public leads need review.`}
                    label="Open requests"
                    value={openReferrals.length + newLeadCount}
                  />
                  <AnalyticsMetricCard
                    detail={
                      totalBeds
                        ? `${availableBeds} of ${totalBeds} live beds are currently marked available.`
                        : "No live bed availability in this view."
                    }
                    label="Beds available"
                    value={totalBeds ? availableBeds : "N/A"}
                  />
                </div>
              </Card>

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
                    <div className="ac-stat-card p-4">
                      <p className="text-sm font-medium text-muted-foreground">Open requests</p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight">{openReferrals.length + newLeadCount}</p>
                    </div>
                    <div className="ac-stat-card p-4">
                      <p className="text-sm font-medium text-muted-foreground">Open referrals</p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight">{openReferrals.length}</p>
                    </div>
                    <div className="ac-stat-card p-4">
                      <p className="text-sm font-medium text-muted-foreground">Beds available</p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight">{availableBeds}</p>
                    </div>
                    <div className="ac-stat-card p-4">
                      <p className="text-sm font-medium text-muted-foreground">Availability</p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight">
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
                    lockedReason={
                      selectedProfile.type === "sober_living" && !selectedProfileCanUseLiveAvailability
                        ? liveBedCountLockedMessage
                        : undefined
                    }
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
                  {selectedProfile.type === "sober_living" ? (
                    <form action={sendBedAvailabilityTextCheck} className="ac-callout mt-4 grid gap-3 p-4">
                      <input name="profileId" type="hidden" value={selectedProfile.id} />
                      <div>
                        <h3 className="font-semibold">Text a bed check</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Send a quick SMS to a manager. Their reply can update this home&apos;s available beds.
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                        <select
                          className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                          disabled={!smsEnabledManagers.length}
                          name="managerId"
                          required
                        >
                          <option value="">Select SMS-enabled manager</option>
                          {smsEnabledManagers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {[manager.firstName, manager.lastName].filter(Boolean).join(" ") || manager.email} · {formatPhoneForDisplay(manager.phone)}
                            </option>
                          ))}
                        </select>
                        <button
                          className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!smsEnabledManagers.length}
                        >
                          Send bed check text
                        </button>
                      </div>
                      {!smsEnabledManagers.length ? (
                        <p className="text-xs leading-5 text-muted-foreground">
                          Add a manager phone number and enable SMS in the Managers tab first.
                        </p>
                      ) : null}
                    </form>
                  ) : null}
                  <div className="ac-callout mt-4 grid gap-4 p-4">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CalendarClock className="text-primary" size={20} />
                          <h3 className="font-semibold">Phone screening windows</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Set recurring weekly intake-call times that accepted referrals can book.
                        </p>
                      </div>
                      {selectedProfileCanUsePhoneScreening ? (
                        <Badge tone="success">Enabled</Badge>
                      ) : (
                        <Badge tone="warning">Plan locked</Badge>
                      )}
                    </div>
                    {query.screeningMessage ? (
                      <div className="rounded-md border border-border bg-white p-3 text-sm font-semibold">
                        {query.screeningMessage}
                      </div>
                    ) : null}
                    {selectedProfileCanUsePhoneScreening ? (
                      <>
                        <form action={addPhoneScreeningWindow} className="grid gap-3 md:grid-cols-[1fr_140px_140px_auto] md:items-end">
                          <input name="profileId" type="hidden" value={selectedProfile.id} />
                          <label className="grid gap-1 text-sm font-semibold">
                            Weekday
                            <select className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" name="dayOfWeek" required>
                              {phoneScreeningDayOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="grid gap-1 text-sm font-semibold">
                            Start
                            <input className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" defaultValue="09:00" name="startTime" required type="time" />
                          </label>
                          <label className="grid gap-1 text-sm font-semibold">
                            End
                            <input className="min-h-10 rounded-md border border-border bg-white px-3 text-sm" defaultValue="12:00" name="endTime" required type="time" />
                          </label>
                          <button className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                            Add window
                          </button>
                        </form>
                        <div className="grid gap-2">
                          {selectedProfile.phoneScreeningWindows.map((window) => (
                            <div key={window.id} className="flex flex-col justify-between gap-2 rounded-md border border-border bg-white p-3 text-sm sm:flex-row sm:items-center">
                              <span className="font-semibold">{formatPhoneScreeningWindow(window)}</span>
                              <form action={deletePhoneScreeningWindow}>
                                <input name="windowId" type="hidden" value={window.id} />
                                <button className="focus-ring min-h-8 rounded-md border border-border bg-white px-3 text-xs font-semibold text-destructive">
                                  Remove
                                </button>
                              </form>
                            </div>
                          ))}
                          {!selectedProfile.phoneScreeningWindows.length ? (
                            <p className="rounded-md border border-dashed border-border bg-white p-3 text-sm text-muted-foreground">
                              No screening windows yet.
                            </p>
                          ) : null}
                        </div>
                        {selectedProfile.phoneScreeningAppointments.length ? (
                          <div className="border-t border-border pt-3">
                            <p className="text-sm font-semibold">Upcoming booked screenings</p>
                            <div className="mt-2 grid gap-2">
                              {selectedProfile.phoneScreeningAppointments.map((appointment) => (
                                <div key={appointment.id} className="rounded-md bg-white p-3 text-sm">
                                  <p className="font-semibold">{formatPhoneScreeningDateTime(appointment.startsAt, appointment.timezone)}</p>
                                  <p className="mt-1 text-muted-foreground">
                                    {appointment.referral.caseManagerName} · {appointment.referral.caseManagerOrganization}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="rounded-md border border-dashed border-border bg-white p-3 text-sm text-muted-foreground">
                        Phone screening scheduling is available on paid plans that receive direct referrals.
                      </p>
                    )}
                  </div>
                </div>
                ) : (
                  <div className="ac-callout mt-5 p-4 text-sm text-muted-foreground">
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
                  {query.referralError ? (
                    <div className="mt-3 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm">
                      {query.referralError}
                    </div>
                  ) : null}
                  {scopedReferrals.length || scopedLeads.length ? (
                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full min-w-[860px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                            <th className="py-3 pr-4 font-semibold">Type</th>
                            <th className="py-3 pr-4 font-semibold">From</th>
                            <th className="py-3 pr-4 font-semibold">Home/program</th>
                            <th className="py-3 pr-4 font-semibold">Details</th>
                            <th className="py-3 pr-4 font-semibold">Status</th>
                            <th className="py-3 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                      {scopedReferrals.map((referral) => (
                            <tr key={referral.id} className="border-b border-border last:border-0">
                              <td className="py-4 pr-4">
                                <Badge>Referral</Badge>
                              </td>
                              <td className="py-4 pr-4">
                                <p className="font-semibold">{referral.caseManagerOrganization}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{referral.caseManagerName}</p>
                              </td>
                              <td className="py-4 pr-4">{referral.aftercareProfile.programName}</td>
                              <td className="py-4 pr-4">
                                <p className="font-medium">
                                  {formatReferralValue(referral.clientAgeRange)} · {formatReferralValue(referral.preferredStartWindow)}
                                </p>
                                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                  {referral.reasonForReferral}
                                </p>
                                {referral.phoneScreeningAppointments[0] ? (
                                  <p className="mt-1 text-xs font-semibold text-primary">
                                    Phone screening {formatPhoneScreeningDateTime(
                                      referral.phoneScreeningAppointments[0].startsAt,
                                      referral.phoneScreeningAppointments[0].timezone
                                    )}
                                  </p>
                                ) : null}
                              </td>
                              <td className="py-4 pr-4">
                                <Badge tone={["accepted", "placed"].includes(referral.status) ? "success" : "warning"}>
                              {formatReferralValue(referral.status)}
                            </Badge>
                              </td>
                              <td className="py-4">
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  <Link
                                    className="focus-ring inline-flex min-h-8 items-center rounded-md border border-border bg-white px-2.5 text-xs font-semibold"
                                    href={referralDetailHref(referral.id, selectedProfile?.id)}
                                  >
                                    View
                                  </Link>
                                  {compactReferralActionOptions(referral.status, allowPlacementTracking).length ? (
                                    <RowActionsMenu label="Referral actions">
                                      <RowActionsMenuLabel>Referral actions</RowActionsMenuLabel>
                                      {compactReferralActionOptions(referral.status, allowPlacementTracking).map(([status, label]) => (
                                        <form key={status} action={updateReferralStatus}>
                                          <input name="referralId" type="hidden" value={referral.id} />
                                          <RowActionsMenuButton
                                            name="status"
                                            value={status}
                                          >
                                            {label}
                                          </RowActionsMenuButton>
                                        </form>
                                      ))}
                                    </RowActionsMenu>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                      ))}
                          {scopedLeads.map((lead) => (
                            <tr key={lead.id} className="border-b border-border last:border-0">
                              <td className="py-4 pr-4">
                                <Badge>Public lead</Badge>
                              </td>
                              <td className="py-4 pr-4">
                                <p className="font-semibold">{lead.name}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{lead.email}</p>
                              </td>
                              <td className="py-4 pr-4">{lead.profile.programName}</td>
                              <td className="py-4 pr-4">
                                <p className="font-medium">Public contact form</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Submitted {formatDate(lead.createdAt)}
                                </p>
                              </td>
                              <td className="py-4 pr-4">
                              <Badge tone={lead.status === "new" ? "warning" : "neutral"}>{lead.status}</Badge>
                              </td>
                              <td className="py-4 text-right text-xs text-muted-foreground">
                                Follow up directly
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="ac-panel-card mt-5 p-4 text-sm leading-6 text-muted-foreground">
                      New referrals and public profile contact forms will appear here.
                    </p>
                  )}
              </Card>

              <Card>
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-xl font-semibold">Availability snapshot</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Scan all homes and spot stale bed counts quickly.
                    </p>
                  </div>
                  <Badge>
                    {liveAvailabilityProfiles.length
                      ? `${availableBeds} of ${totalBeds} beds available`
                      : "Live bed count locked"}
                  </Badge>
                </div>
                {scopedProfiles.length ? (
                  <div className="mt-5 grid gap-3">
                    {scopedProfiles.map((profile) => {
                      const visiblePopulationBeds = getVisiblePopulationBeds(profile);
                      const liveBedCountLocked =
                        profile.type === "sober_living" && !canUseLiveAvailability(appUser.organization, profile);
                      const lastUpdated =
                        profile.type === "sober_living"
                          ? profile.bedsAvailableUpdatedAt
                          : profile.acceptingNewPatientsUpdatedAt;

                      return (
                        <div key={profile.id} className="ac-panel-card grid gap-3 p-3 md:grid-cols-[1fr_1.4fr_auto] md:items-center">
                          <div>
                            <p className="font-semibold">{profile.programName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{availabilityLabel(profile)}</p>
                          </div>
                          <div className="relative min-h-10">
                            <div className={cn("flex flex-wrap gap-2", liveBedCountLocked ? "opacity-25" : null)}>
                              {profile.type === "sober_living" && visiblePopulationBeds.length ? (
                                visiblePopulationBeds.map((bed) => (
                                  <Badge
                                    key={bed.label}
                                    tone={bed.available > 0 ? "success" : "neutral"}
                                    className="min-h-8 px-3 text-sm shadow-sm"
                                  >
                                    <span className="text-muted-foreground">{bed.label}</span>
                                    <span>{bed.available}/{bed.total}</span>
                                  </Badge>
                                ))
                              ) : (
                                <Badge
                                  tone={
                                    profile.type === "continued_care" && profile.acceptingNewPatients
                                      ? "success"
                                      : "neutral"
                                  }
                                  className="min-h-8 px-3 text-sm shadow-sm"
                                >
                                  {profile.type === "continued_care"
                                    ? availabilityLabel(profile)
                                    : "Population beds not set"}
                                </Badge>
                              )}
                            </div>
                            {liveBedCountLocked ? (
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                                <span className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
                                  {liveBedCountLockedMessage}
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            <span className="text-xs text-muted-foreground">{formatDate(lastUpdated)}</span>
                            <Link
                              className="focus-ring inline-flex min-h-8 items-center rounded-md border border-border bg-white px-2.5 text-xs font-semibold"
                              href={
                                liveBedCountLocked
                                  ? "/dashboard/aftercare?tab=subscription"
                                  : `/dashboard/aftercare?tab=overview&profileId=${profile.id}`
                              }
                            >
                              {liveBedCountLocked ? "Upgrade" : "Update"}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="ac-panel-card mt-4 p-4 text-sm text-muted-foreground">
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
                  <div className="ac-metric-card p-4">
                    <p className="text-sm text-muted-foreground">Profiles shown</p>
                    <p className="mt-1 text-2xl font-semibold">{scopedProfiles.length}</p>
                  </div>
                  <div className="ac-metric-card p-4">
                    <p className="text-sm text-muted-foreground">Pending documents</p>
                    <p className="mt-1 text-2xl font-semibold">{scopedPendingDocumentCount}</p>
                  </div>
                  <div className="ac-metric-card p-4">
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
                {canAddProfiles ? (
                  <Link
                    className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                    href={addProfileHref(appUser.organization?.type)}
                  >
                    Add home
                  </Link>
                ) : null}
              </div>
              {!canAddProfiles ? (
                <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-3">
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary text-foreground">
                      <Info className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-semibold">You are at your current home/program limit.</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {planCountedProfiles.length} of{" "}
                        {formatPlanLimit(currentAftercarePlan(appUser.organization?.subscriptionPlan).profiles)}{" "}
                        published or draft homes/programs used.
                        {nextProfilePlan
                          ? ` Upgrade to ${nextProfilePlan.label} to add another.`
                          : " Contact support to add more homes or programs."}
                      </p>
                    </div>
                  </div>
                  <Link
                    className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-surface-secondary px-6 text-sm font-semibold text-foreground shadow-sm hover:bg-surface-tertiary"
                    href="/dashboard/aftercare?tab=subscription"
                  >
                    Upgrade
                  </Link>
                </div>
              ) : null}
              {homesMessage ? (
                <div className="mt-4 rounded-md border border-success/40 bg-success/10 p-4 text-sm font-semibold text-success-foreground">
                  {homesMessage}
                </div>
              ) : null}

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
                        const liveBedCountLocked =
                          profile.type === "sober_living" && !canUseLiveAvailability(appUser.organization, profile);

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
                            <td className="py-4 pr-4">
                              {liveBedCountLocked ? (
                                <span className="text-xs font-semibold text-muted-foreground">
                                  Live bed count locked
                                </span>
                              ) : (
                                availabilityLabel(profile)
                              )}
                            </td>
                            <td className="py-4 pr-4">
                              {profile.type === "sober_living" ? (
                                <div className="relative min-h-10">
                                  <div className={cn("grid gap-1 text-xs", liveBedCountLocked ? "opacity-25" : null)}>
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
                                  {liveBedCountLocked ? (
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                                      <span className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
                                        {liveBedCountLockedMessage}
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Program availability</span>
                              )}
                            </td>
                            <td className="py-4 pr-4">{readiness.percent}%</td>
                            <td className="py-4 pr-4">
                              {liveBedCountLocked
                                ? "Locked"
                                : formatDate(
                                    profile.type === "sober_living"
                                      ? profile.bedsAvailableUpdatedAt
                                      : profile.acceptingNewPatientsUpdatedAt
                                  )}
                            </td>
                            <td className="py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  className="focus-ring inline-flex min-h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
                                  href={`/profiles/${profile.slug}?preview=1`}
                                >
                                  View profile
                                </Link>
                                <RowActionsMenu label={`${profile.programName} actions`}>
                                  <RowActionsMenuLabel>Actions</RowActionsMenuLabel>
                                  <RowActionsMenuLink
                                    description="Update home details, availability, media, and profile content."
                                    href={`/dashboard/aftercare/profiles/${profile.id}`}
                                  >
                                    Edit home
                                  </RowActionsMenuLink>
                                  <RowActionsMenuDivider />
                                  {profile.status === "unpublished" ? (
                                    <form action={updateAftercareProfileStatusFromDashboard}>
                                      <input name="profileId" type="hidden" value={profile.id} />
                                      <RowActionsMenuButton
                                        description="Move this profile back into draft editing."
                                        name="status"
                                        value="draft"
                                      >
                                        Restore as draft
                                      </RowActionsMenuButton>
                                    </form>
                                  ) : (
                                    <form action={updateAftercareProfileStatusFromDashboard}>
                                      <input name="profileId" type="hidden" value={profile.id} />
                                      <ConfirmSubmitButton
                                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-destructive transition hover:bg-surface-secondary"
                                        message="Unpublish this home/program? It will be removed from marketplace search and will no longer count toward your plan limit."
                                        name="status"
                                        value="unpublished"
                                      >
                                        <span className="font-semibold">Unpublish home</span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                          Hide this listing from search without deleting its data.
                                        </span>
                                      </ConfirmSubmitButton>
                                    </form>
                                  )}
                                </RowActionsMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ac-panel-card mt-5 p-4 text-sm text-muted-foreground">
                  No homes or programs have been created yet.
                </div>
              )}
            </Card>
          ) : null}

          {activeTab === "managers" ? (
            <Card>
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <h2 className="text-xl font-semibold">Managers</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Users associated with this account and their current roles.
                  </p>
                  {query.managerMessage ? (
                    <p className="mt-2 text-sm font-semibold text-primary">{query.managerMessage}</p>
                  ) : null}
                </div>
                {appUser.role === "aftercare_admin" ? (
                  <Link
                    className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                    href="/dashboard/aftercare?tab=managers&invite=1"
                  >
                    <MailPlus size={16} />
                    Invite managers
                  </Link>
                ) : null}
              </div>
              <div className="mt-5 grid gap-3">
                {managers.map((manager) => (
                  <div key={manager.id} className="ac-panel-card flex flex-col justify-between gap-3 p-4 md:flex-row md:items-center">
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
                      <Badge tone={manager.smsOptIn && manager.phone ? "success" : "neutral"}>
                        {manager.smsOptIn && manager.phone ? "SMS enabled" : "SMS off"}
                      </Badge>
                      {appUser.role === "aftercare_admin" &&
                      manager.role === "aftercare_manager" &&
                      manager.id !== appUser.id ? (
                        <form action={removeAftercareManager}>
                          <input name="managerId" type="hidden" value={manager.id} />
                          <ConfirmSubmitButton
                            className="focus-ring min-h-9 rounded-md border border-border bg-white px-3 text-sm font-semibold text-destructive"
                            message={`Remove ${[manager.firstName, manager.lastName].filter(Boolean).join(" ") || manager.email} from this account? They will lose access to this organization's dashboard.`}
                          >
                            Remove manager
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                    </div>
                    <form action={updateManagerSmsSettings} className="ac-panel-card grid gap-3 p-3 md:col-span-2">
                      <input name="managerId" type="hidden" value={manager.id} />
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
                        <label className="grid gap-2 text-sm font-medium">
                          SMS phone
                          <input
                            className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                            defaultValue={manager.phone ?? ""}
                            name="phone"
                            placeholder="(555) 555-5555"
                          />
                        </label>
                        <label className="flex min-h-10 items-center gap-2 text-sm font-medium">
                          <input
                            defaultChecked={manager.smsOptIn}
                            name="smsOptIn"
                            type="checkbox"
                            value="yes"
                          />
                          Allow bed check texts
                        </label>
                        <button className="focus-ring min-h-10 rounded-md border border-border bg-white px-3 text-sm font-semibold">
                          Save SMS
                        </button>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Phone is only used for operational bed availability checks.
                      </p>
                    </form>
                  </div>
                ))}
                {pendingManagerInvites.map((invite) => (
                  <div key={invite.id} className="ac-panel-card flex flex-col justify-between gap-3 p-4 md:flex-row md:items-center">
                    <div>
                      <p className="font-semibold">{invite.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Invited {formatDate(invite.createdAt)}. They will be added as a manager when they create an account with this email.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="warning">Pending invite</Badge>
                      {appUser.role === "aftercare_admin" ? (
                        <form action={removeAftercareManagerInvite}>
                          <input name="inviteId" type="hidden" value={invite.id} />
                          <button className="focus-ring min-h-9 rounded-md border border-border bg-white px-3 text-sm font-semibold">
                            Remove
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {activeTab === "subscription" ? (
            <Card>
              <CreditCard className="text-primary" size={24} />
              <div className="mt-3 flex flex-col justify-between gap-3 md:flex-row md:items-start">
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
                      <h3 className="text-lg font-semibold">Compare aftercare plans</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Your current plan is marked below. Choose a monthly or annual billing cycle before changing plans.
                      </p>
                    </div>
                    <Link className="focus-ring ac-button ac-button--secondary" href="/dashboard/aftercare?tab=subscription">
                      Back to current plan
                    </Link>
                  </div>

                  <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
                    <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                      <thead className="border-b border-border bg-surface-secondary text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Plan</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Profiles</th>
                          <th className="px-4 py-3">Managers</th>
                          <th className="px-4 py-3">Unlocks</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aftercareBillingPlans.map((plan) => {
                          const planLimits = currentAftercarePlan(plan.key);
                          const isCurrentPlan = aftercareBillingPlan.key === plan.key;

                          return (
                            <tr key={plan.key} className="border-b border-border last:border-b-0">
                              <td className="px-4 py-4 align-top">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{plan.label}</span>
                                  {isCurrentPlan ? <Badge tone="success">Current</Badge> : null}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top font-semibold">{plan.priceLabels.monthly}</td>
                              <td className="px-4 py-4 align-top">{formatPlanLimit(planLimits.profiles)}</td>
                              <td className="px-4 py-4 align-top">{formatPlanLimit(planLimits.managers)}</td>
                              <td className="px-4 py-4 align-top text-muted-foreground">
                                <ul className="grid gap-1">
                                  {plan.features.map((feature) => (
                                    <li key={feature}>{feature}</li>
                                  ))}
                                </ul>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <form action={changeBillingPlan} className="flex justify-end gap-2">
                                  <input name="returnTo" type="hidden" value="/dashboard/aftercare?tab=subscription" />
                                  <input name="plan" type="hidden" value={plan.key} />
                                  <select
                                    aria-label={`${plan.label} billing cycle`}
                                    className="min-h-10 max-w-32 rounded-md border border-border bg-white px-3 text-sm"
                                    name="billingCycle"
                                    defaultValue={appUser.organization?.subscriptionBillingCycle || "monthly"}
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
                      <h3 className="mt-1 text-2xl font-semibold">
                        {aftercareBillingPlan.label}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {aftercareCurrentPriceLabel}
                      </p>
                    </div>
                    <Badge tone={appUser.organization?.subscriptionStatus === "active" ? "success" : "warning"}>
                      {formatBillingStatus(appUser.organization?.subscriptionStatus)}
                    </Badge>
                  </div>
                  <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                    <div className="ac-stat-card p-4">
                      <dt className="text-muted-foreground">Homes/programs used</dt>
                      <dd className="mt-1 text-xl font-semibold">
                        {planCountedProfiles.length} / {formatPlanLimit(currentAftercarePlan(appUser.organization?.subscriptionPlan).profiles)}
                      </dd>
                    </div>
                    <div className="ac-stat-card p-4">
                      <dt className="text-muted-foreground">Manager seats used</dt>
                      <dd className="mt-1 text-xl font-semibold">
                        {managers.filter((manager) => manager.isActive).length} / {formatPlanLimit(currentAftercarePlan(appUser.organization?.subscriptionPlan).managers)}
                      </dd>
                    </div>
                    <div className="ac-stat-card p-4">
                      <dt className="text-muted-foreground">Billing cycle</dt>
                      <dd className="mt-1 font-semibold">{appUser.organization?.subscriptionBillingCycle || "Not selected"}</dd>
                    </div>
                    <div className="ac-stat-card p-4">
                      <dt className="text-muted-foreground">Renews / ends</dt>
                      <dd className="mt-1 font-semibold">{formatBillingDate(appUser.organization?.subscriptionRenewsAt)}</dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link className="focus-ring ac-button ac-button--primary" href="/dashboard/aftercare?tab=subscription&billingView=plans">
                      Upgrade or change plan
                    </Link>
                    {appUser.organization?.stripeSubscriptionId ? (
                      <>
                      <form action={createBillingPortalSession}>
                        <input name="returnTo" type="hidden" value="/dashboard/aftercare?tab=subscription" />
                        <button className="focus-ring ac-button ac-button--secondary">
                          Manage payment method
                        </button>
                      </form>
                      <form action={cancelBillingSubscription}>
                        <input name="returnTo" type="hidden" value="/dashboard/aftercare?tab=subscription" />
                        <ConfirmSubmitButton
                          className="focus-ring ac-button ac-button--secondary text-destructive"
                          message={`Are you sure? Plan will end on ${formatBillingDate(appUser.organization.subscriptionRenewsAt)}.`}
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
                      Higher plans can unlock more profiles, more managers, direct referral intake, live availability updates, verification eligibility, messaging, and placement tracking.
                    </p>
                  </div>
                </div>
              )}
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
              {isEditingDisplayName ? (
                <form action={updateUserDisplayName} className="ac-panel-card mt-6 grid gap-4 p-4">
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
        </section>
      </div>
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
                    Add one or more emails. Managers will join this aftercare account when they sign up with an invited email.
                  </p>
                </div>
              </div>
              <Link
                aria-label="Close invite managers"
                className="focus-ring ac-modal-close"
                href="/dashboard/aftercare?tab=managers"
              >
                <X size={18} />
              </Link>
            </div>
            <form action={inviteAftercareManagers} className="mt-5 grid gap-4">
              {query.managerMessage ? (
                <p className="ac-callout p-3 text-sm font-semibold text-foreground">
                  {query.managerMessage}
                </p>
              ) : null}
              <label className="grid gap-2 text-sm font-medium">
                Email addresses
                <textarea
                  className="min-h-36 rounded-md border border-border bg-white px-3 py-2 text-sm"
                  disabled={!canInviteMoreManagers}
                  name="emails"
                  placeholder={"manager@example.com\noperations@example.com"}
                  required
                />
              </label>
              <p className="text-xs leading-5 text-muted-foreground">
                Separate emails with commas, spaces, or new lines. Paid plan limits are checked before invites are saved.
              </p>
              {!canInviteMoreManagers ? (
                <p className="ac-callout p-3 text-sm font-semibold">
                  Upgrade the aftercare plan to add more managers.
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Link
                  className="focus-ring ac-button ac-button--secondary"
                  href="/dashboard/aftercare?tab=managers"
                >
                  Cancel
                </Link>
                <button
                  className="focus-ring ac-button ac-button--primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canInviteMoreManagers}
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
