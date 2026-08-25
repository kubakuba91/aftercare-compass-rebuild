import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing-header";
import { PricingPlansToggle, type PricingAudience, type PricingPlan } from "@/components/pricing-plans-toggle";
import { ButtonLink } from "@/components/ui/button-link";
import { aftercarePlans, referentPlans } from "@/lib/plans";
import { dashboardAppUrl, publicAppUrl } from "@/lib/app-urls";

export const metadata: Metadata = {
  title: "Pricing | Aftercare Compass",
  description:
    "Compare Aftercare Compass plans for recovery programs, case managers, care coordinators, and health systems."
};

function formatLimit(value: number | "unlimited", singular: string, plural = `${singular}s`) {
  if (value === "unlimited") return `Unlimited ${plural}`;
  return `${value} ${value === 1 ? singular : plural}`;
}

const providerPlans: PricingPlan[] = [
  {
    name: aftercarePlans.claimed_listing.label,
    price: aftercarePlans.claimed_listing.monthlyPrice,
    description: "Establish your presence and keep your program details current.",
    features: [
      formatLimit(aftercarePlans.claimed_listing.profiles, "program profile"),
      formatLimit(aftercarePlans.claimed_listing.managers, "manager"),
      `${aftercarePlans.claimed_listing.photoGalleryLimit} photos per profile`,
      "Public provider listing",
      "General inquiry form",
      `${aftercarePlans.claimed_listing.badge} badge`
    ],
    ctaLabel: "Claim Your Listing",
    ctaHref: publicAppUrl("/search")
  },
  {
    name: aftercarePlans.professional.label,
    price: aftercarePlans.professional.monthlyPrice,
    description: "For individual programs ready to receive and manage live referrals.",
    features: [
      formatLimit(aftercarePlans.professional.profiles, "program profile"),
      formatLimit(aftercarePlans.professional.managers, "manager"),
      `${aftercarePlans.professional.photoGalleryLimit} photos per profile`,
      "Direct referral intake",
      "Live availability updates",
      "Operational analytics",
      "Verification eligibility",
      "General inquiry form"
    ],
    ctaLabel: "Get Started",
    ctaHref: dashboardAppUrl("/sign-up")
  },
  {
    name: aftercarePlans.verified.label,
    price: aftercarePlans.verified.monthlyPrice,
    description: "For growing organizations that need trust, collaboration, and tracking.",
    features: [
      formatLimit(aftercarePlans.verified.profiles, "program profile"),
      formatLimit(aftercarePlans.verified.managers, "manager"),
      `${aftercarePlans.verified.photoGalleryLimit} photos per profile`,
      "Everything in Aftercare Basic",
      "Aftercare Compass Verified badge",
      "Secure messaging",
      "Referral status tracking",
      "Placement tracking"
    ],
    ctaLabel: "Choose Verified",
    ctaHref: dashboardAppUrl("/sign-up"),
    featured: true
  },
  {
    name: aftercarePlans.network.label,
    price: aftercarePlans.network.monthlyPrice,
    description: "For multi-location networks managing programs and teams at scale.",
    features: [
      formatLimit(aftercarePlans.network.profiles, "program profile"),
      formatLimit(aftercarePlans.network.managers, "manager"),
      `${aftercarePlans.network.photoGalleryLimit} photos per profile`,
      "Everything in Aftercare Verified",
      "Enterprise Verified Network badge",
      "Network-wide analytics",
      "Multi-location referral management",
      "Placement tracking"
    ],
    ctaLabel: "Choose Network",
    ctaHref: dashboardAppUrl("/sign-up")
  }
];

const caseManagerPlans: PricingPlan[] = [
  {
    name: referentPlans.starter.label,
    price: referentPlans.starter.monthlyPrice,
    description: "For small referral teams that need a faster placement workflow.",
    features: [
      formatLimit(referentPlans.starter.teamMembers, "team member"),
      "Search real-time program availability",
      "Submit direct referrals",
      "Basic referral workflow",
      "Verified provider profiles"
    ],
    ctaLabel: "Start with Starter",
    ctaHref: dashboardAppUrl("/sign-up")
  },
  {
    name: referentPlans.professional.label,
    price: referentPlans.professional.monthlyPrice,
    description: "For active care teams coordinating placements every day.",
    features: [
      formatLimit(referentPlans.professional.teamMembers, "team member"),
      "Everything in Starter",
      "Secure provider messaging",
      "Saved searches",
      "Real-time bed alerts",
      "Referral status tracking",
      "Placement notes"
    ],
    ctaLabel: "Choose Professional",
    ctaHref: dashboardAppUrl("/sign-up"),
    featured: true
  },
  {
    name: referentPlans.enterprise.label,
    price: referentPlans.enterprise.monthlyPrice,
    description: "For health systems and large organizations with custom requirements.",
    features: [
      formatLimit(referentPlans.enterprise.teamMembers, "team member"),
      "Everything in Professional",
      "Organization-wide rollout",
      "Custom onboarding and support",
      "Centralized referral workflows",
      "Custom pricing"
    ],
    ctaLabel: "Contact Sales",
    ctaHref: "mailto:admin@aftercarecompass.com?subject=Aftercare%20Compass%20Enterprise"
  }
];

export default async function PricingPage({
  searchParams
}: {
  searchParams: Promise<{ audience?: string }>;
}) {
  const { audience } = await searchParams;
  const initialAudience: PricingAudience = audience === "case-managers" ? "case-managers" : "providers";

  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="relative border-b border-border bg-[#f4f8ff]">
          <div className="pointer-events-none absolute -right-24 -top-40 size-[30rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="shell relative py-16 text-center sm:py-20">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Simple, transparent pricing</p>
            <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl lg:text-6xl">
              A plan for every handoff.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Choose the tools your team needs today. Upgrade as your program, referral team, or network grows.
            </p>
          </div>
        </section>

        <PricingPlansToggle
          caseManagerPlans={caseManagerPlans}
          initialAudience={initialAudience}
          providerPlans={providerPlans}
        />

        <section className="shell py-16 text-center sm:py-20">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#17212b] sm:text-4xl">Not sure which plan fits?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">Tell us how your team works and we’ll help you choose the right starting point.</p>
          <div className="mt-8">
            <ButtonLink href={publicAppUrl("/contact")}>Talk to Our Team</ButtonLink>
          </div>
        </section>
      </main>
    </>
  );
}
