import { OrganizationType, SubscriptionStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { normalizeAftercarePlanKey, normalizeReferentPlanKey } from "@/lib/feature-gates";
import { aftercarePlans, referentPlans } from "@/lib/plans";
import { getStripe, hasStripeConfig } from "@/lib/stripe";

export const billingCycleOptions = ["monthly", "annual"] as const;

export type BillingCycle = (typeof billingCycleOptions)[number];
export type BillingPlanAudience = "referent" | "aftercare";
export type ReferentPlanKey = keyof typeof referentPlans;
export type AftercarePlanKey = keyof typeof aftercarePlans;
export type BillingPlanKey = ReferentPlanKey | AftercarePlanKey;

export type BillingPlan = {
  key: BillingPlanKey;
  label: string;
  monthlyPrice: number | null;
  audience: BillingPlanAudience;
  monthlyEnv: string;
  annualEnv: string;
  fallbackMonthlyEnv?: string;
  fallbackAnnualEnv?: string;
  features: string[];
};

export type BillingPlanWithPrices = BillingPlan & {
  priceLabels: Record<BillingCycle, string>;
};

export const billingPlans: Record<BillingPlanAudience, BillingPlan[]> = {
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
      key: "claimed_listing",
      label: aftercarePlans.claimed_listing.label,
      monthlyPrice: aftercarePlans.claimed_listing.monthlyPrice,
      audience: "aftercare",
      monthlyEnv: "STRIPE_AFTERCARE_CLAIMED_LISTING_MONTHLY_PRICE_ID",
      annualEnv: "STRIPE_AFTERCARE_CLAIMED_LISTING_ANNUAL_PRICE_ID",
      features: ["Public listing", "General inquiry form", "Self-reported badge"]
    },
    {
      key: "professional",
      label: aftercarePlans.professional.label,
      monthlyPrice: aftercarePlans.professional.monthlyPrice,
      audience: "aftercare",
      monthlyEnv: "STRIPE_AFTERCARE_PROFESSIONAL_MONTHLY_PRICE_ID",
      annualEnv: "STRIPE_AFTERCARE_PROFESSIONAL_ANNUAL_PRICE_ID",
      fallbackMonthlyEnv: "STRIPE_AFTERCARE_BASIC_MONTHLY_PRICE_ID",
      fallbackAnnualEnv: "STRIPE_AFTERCARE_BASIC_ANNUAL_PRICE_ID",
      features: [
        `${aftercarePlans.professional.profiles} profile`,
        `${aftercarePlans.professional.managers} managers`,
        "Direct referral intake",
        "Live availability updates"
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
        "Verified badge eligibility",
        "Messaging and referral status tracking"
      ]
    },
    {
      key: "network",
      label: aftercarePlans.network.label,
      monthlyPrice: aftercarePlans.network.monthlyPrice,
      audience: "aftercare",
      monthlyEnv: "STRIPE_AFTERCARE_NETWORK_MONTHLY_PRICE_ID",
      annualEnv: "STRIPE_AFTERCARE_NETWORK_ANNUAL_PRICE_ID",
      features: ["Unlimited profiles", "Unlimited managers", "Enterprise analytics and routing"]
    }
  ]
};

export function billingAudienceForOrganization(type: OrganizationType): BillingPlanAudience {
  return type === OrganizationType.referent ? "referent" : "aftercare";
}

export function planBelongsToAudience(planKey: string, audience: BillingPlanAudience) {
  const normalizedPlanKey = audience === "aftercare"
    ? normalizeAftercarePlanKey(planKey)
    : normalizeReferentPlanKey(planKey);

  return billingPlans[audience].some((plan) => plan.key === normalizedPlanKey);
}

export function getBillingPlan(audience: BillingPlanAudience, planKey: string | null | undefined) {
  const normalizedPlanKey = audience === "aftercare"
    ? normalizeAftercarePlanKey(planKey)
    : normalizeReferentPlanKey(planKey);

  return billingPlans[audience].find((plan) => plan.key === normalizedPlanKey) ?? billingPlans[audience][0];
}

export function getStripePriceId(audience: BillingPlanAudience, planKey: string, cycle: string) {
  const plan = getBillingPlan(audience, planKey);
  const envKey = cycle === "annual" ? plan.annualEnv : plan.monthlyEnv;
  const fallbackEnvKey = cycle === "annual" ? plan.fallbackAnnualEnv : plan.fallbackMonthlyEnv;

  return {
    envKey,
    priceId: process.env[envKey] || (fallbackEnvKey ? process.env[fallbackEnvKey] : undefined)
  };
}

function formatStripePrice(unitAmount: number | null, currency: string | null | undefined, cycle: BillingCycle) {
  if (unitAmount === null) {
    return "Custom";
  }

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "usd",
    maximumFractionDigits: unitAmount % 100 === 0 ? 0 : 2
  }).format(unitAmount / 100);

  return `${formattedAmount}/${cycle === "annual" ? "yr" : "mo"}`;
}

const retrieveStripePrice = unstable_cache(
  async (priceId: string) => {
    if (!hasStripeConfig()) {
      return null;
    }

    try {
      const price = await getStripe().prices.retrieve(priceId);

      return {
        currency: price.currency,
        unitAmount: price.unit_amount
      };
    } catch (error) {
      console.error("Stripe price lookup failed", priceId, error);
      return null;
    }
  },
  ["stripe-price-display"],
  { revalidate: 60 * 60 }
);

export function formatPlanPrice(monthlyPrice: number | null, cycle: BillingCycle) {
  if (!monthlyPrice) {
    return "Custom";
  }

  if (cycle === "annual") {
    return `$${monthlyPrice * 10}/yr`;
  }

  return `$${monthlyPrice}/mo`;
}

export async function getBillingPlansWithStripePrices(audience: BillingPlanAudience): Promise<BillingPlanWithPrices[]> {
  return Promise.all(
    billingPlans[audience].map(async (plan) => {
      const priceLabels = {
        monthly: formatPlanPrice(plan.monthlyPrice, "monthly"),
        annual: formatPlanPrice(plan.monthlyPrice, "annual")
      };

      if (plan.monthlyPrice === null || plan.monthlyPrice === 0) {
        return { ...plan, priceLabels };
      }

      await Promise.all(
        billingCycleOptions.map(async (cycle) => {
          const { priceId } = getStripePriceId(audience, plan.key, cycle);

          if (!priceId) {
            return;
          }

          const stripePrice = await retrieveStripePrice(priceId);

          if (stripePrice) {
            priceLabels[cycle] = formatStripePrice(stripePrice.unitAmount, stripePrice.currency, cycle);
          }
        })
      );

      return { ...plan, priceLabels };
    })
  );
}

export function planKeyFromPriceId(priceId: string | null | undefined) {
  if (!priceId) {
    return null;
  }

  for (const plans of Object.values(billingPlans)) {
    for (const plan of plans) {
      if (
        process.env[plan.monthlyEnv] === priceId ||
        process.env[plan.annualEnv] === priceId ||
        (plan.fallbackMonthlyEnv && process.env[plan.fallbackMonthlyEnv] === priceId) ||
        (plan.fallbackAnnualEnv && process.env[plan.fallbackAnnualEnv] === priceId)
      ) {
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
      if (
        process.env[plan.monthlyEnv] === priceId ||
        (plan.fallbackMonthlyEnv && process.env[plan.fallbackMonthlyEnv] === priceId)
      ) {
        return "monthly";
      }

      if (
        process.env[plan.annualEnv] === priceId ||
        (plan.fallbackAnnualEnv && process.env[plan.fallbackAnnualEnv] === priceId)
      ) {
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
