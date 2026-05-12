import { OrganizationType, SubscriptionStatus } from "@prisma/client";
import { aftercarePlans, referentPlans } from "@/lib/plans";

export const billingCycleOptions = ["monthly", "annual"] as const;

export type BillingCycle = (typeof billingCycleOptions)[number];
export type BillingPlanAudience = "referent" | "aftercare";
export type ReferentPlanKey = keyof typeof referentPlans;
export type AftercarePlanKey = keyof typeof aftercarePlans;
export type BillingPlanKey = ReferentPlanKey | AftercarePlanKey;

type BillingPlan = {
  key: BillingPlanKey;
  label: string;
  monthlyPrice: number | null;
  audience: BillingPlanAudience;
  monthlyEnv: string;
  annualEnv: string;
  features: string[];
};

export const billingPlans = {
  referent: [
    {
      key: "starter",
      label: referentPlans.starter.label,
      monthlyPrice: referentPlans.starter.monthlyPrice,
      audience: "referent",
      monthlyEnv: "STRIPE_REFERENT_STARTER_MONTHLY_PRICE_ID",
      annualEnv: "STRIPE_REFERENT_STARTER_ANNUAL_PRICE_ID",
      features: [
        `${referentPlans.starter.teamMembers} team members`,
        "Search and place referrals",
        "Basic referral workflow"
      ]
    },
    {
      key: "professional",
      label: referentPlans.professional.label,
      monthlyPrice: referentPlans.professional.monthlyPrice,
      audience: "referent",
      monthlyEnv: "STRIPE_REFERENT_PROFESSIONAL_MONTHLY_PRICE_ID",
      annualEnv: "STRIPE_REFERENT_PROFESSIONAL_ANNUAL_PRICE_ID",
      features: [
        `${referentPlans.professional.teamMembers} team members`,
        "Messaging included",
        "Saved searches and status tracking"
      ]
    },
    {
      key: "enterprise",
      label: referentPlans.enterprise.label,
      monthlyPrice: null,
      audience: "referent",
      monthlyEnv: "STRIPE_REFERENT_ENTERPRISE_MONTHLY_PRICE_ID",
      annualEnv: "STRIPE_REFERENT_ENTERPRISE_ANNUAL_PRICE_ID",
      features: ["Unlimited team members", "Custom support", "Custom pricing"]
    }
  ],
  aftercare: [
    {
      key: "basic",
      label: aftercarePlans.basic.label,
      monthlyPrice: aftercarePlans.basic.monthlyPrice,
      audience: "aftercare",
      monthlyEnv: "STRIPE_AFTERCARE_BASIC_MONTHLY_PRICE_ID",
      annualEnv: "STRIPE_AFTERCARE_BASIC_ANNUAL_PRICE_ID",
      features: [
        `${aftercarePlans.basic.profiles} profile`,
        `${aftercarePlans.basic.managers} managers`,
        "Basic profile publishing"
      ]
    },
    {
      key: "verified",
      label: aftercarePlans.verified.label,
      monthlyPrice: aftercarePlans.verified.monthlyPrice,
      audience: "aftercare",
      monthlyEnv: "STRIPE_AFTERCARE_VERIFIED_MONTHLY_PRICE_ID",
      annualEnv: "STRIPE_AFTERCARE_VERIFIED_ANNUAL_PRICE_ID",
      features: [
        `${aftercarePlans.verified.profiles} profiles`,
        `${aftercarePlans.verified.managers} managers`,
        "Live availability and messaging"
      ]
    },
    {
      key: "network",
      label: aftercarePlans.network.label,
      monthlyPrice: aftercarePlans.network.monthlyPrice,
      audience: "aftercare",
      monthlyEnv: "STRIPE_AFTERCARE_NETWORK_MONTHLY_PRICE_ID",
      annualEnv: "STRIPE_AFTERCARE_NETWORK_ANNUAL_PRICE_ID",
      features: ["Unlimited profiles", "Unlimited managers", "Network-level availability"]
    }
  ]
} as const satisfies Record<BillingPlanAudience, BillingPlan[]>;

export function billingAudienceForOrganization(type: OrganizationType): BillingPlanAudience {
  return type === OrganizationType.referent ? "referent" : "aftercare";
}

export function planBelongsToAudience(planKey: string, audience: BillingPlanAudience) {
  return billingPlans[audience].some((plan) => plan.key === planKey);
}

export function getBillingPlan(audience: BillingPlanAudience, planKey: string | null | undefined) {
  return billingPlans[audience].find((plan) => plan.key === planKey) ?? billingPlans[audience][0];
}

export function getStripePriceId(audience: BillingPlanAudience, planKey: string, cycle: string) {
  const plan = getBillingPlan(audience, planKey);
  const envKey = cycle === "annual" ? plan.annualEnv : plan.monthlyEnv;

  return {
    envKey,
    priceId: process.env[envKey]
  };
}

export function planKeyFromPriceId(priceId: string | null | undefined) {
  if (!priceId) {
    return null;
  }

  for (const plans of Object.values(billingPlans)) {
    for (const plan of plans) {
      if (process.env[plan.monthlyEnv] === priceId || process.env[plan.annualEnv] === priceId) {
        return plan.key;
      }
    }
  }

  return null;
}

export function billingCycleFromPriceId(priceId: string | null | undefined): BillingCycle | null {
  if (!priceId) {
    return null;
  }

  for (const plans of Object.values(billingPlans)) {
    for (const plan of plans) {
      if (process.env[plan.monthlyEnv] === priceId) {
        return "monthly";
      }

      if (process.env[plan.annualEnv] === priceId) {
        return "annual";
      }
    }
  }

  return null;
}

export function subscriptionStatusFromStripe(status: string): SubscriptionStatus {
  if (status in SubscriptionStatus) {
    return status as SubscriptionStatus;
  }

  if (status === "incomplete_expired") {
    return SubscriptionStatus.incomplete;
  }

  return SubscriptionStatus.incomplete;
}

export function formatBillingStatus(status: string | null | undefined) {
  if (!status) {
    return "Not connected";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPlanPrice(monthlyPrice: number | null, cycle: BillingCycle) {
  if (!monthlyPrice) {
    return "Custom";
  }

  if (cycle === "annual") {
    return `$${monthlyPrice * 10}/yr`;
  }

  return `$${monthlyPrice}/mo`;
}
