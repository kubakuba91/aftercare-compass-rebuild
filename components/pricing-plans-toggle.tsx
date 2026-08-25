"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

export type PricingPlan = {
  name: string;
  price: number | null;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
};

export type PricingAudience = "providers" | "case-managers";

function PricingCards({ plans, columns }: { plans: PricingPlan[]; columns: "three" | "four" }) {
  return (
    <div className={cn("grid gap-5", columns === "four" ? "lg:grid-cols-2 xl:grid-cols-4" : "lg:grid-cols-3")}>
      {plans.map((plan) => (
        <article
          className={cn(
            "relative flex h-full flex-col rounded-[1.5rem] border bg-white p-6 shadow-[0_18px_50px_rgba(23,33,43,0.07)] sm:p-7",
            plan.featured ? "border-primary ring-2 ring-primary/15" : "border-border"
          )}
          key={plan.name}
        >
          {plan.featured ? (
            <span
              className="absolute right-5 top-0 z-10 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] shadow-sm"
              style={{ backgroundColor: "#10195e", color: "#ffffff" }}
            >
              Most popular
            </span>
          ) : null}
          <h3 className="text-xl font-semibold text-[#17212b]">{plan.name}</h3>
          <div className="mt-5 flex items-end gap-1 text-[#17212b]">
            {plan.price === null ? (
              <span className="text-4xl font-semibold tracking-[-0.04em]">Custom</span>
            ) : plan.price === 0 ? (
              <span className="text-4xl font-semibold tracking-[-0.04em]">Free</span>
            ) : (
              <>
                <span className="pb-1 text-lg font-semibold">$</span>
                <span className="text-5xl font-semibold tracking-[-0.05em]">{plan.price}</span>
                <span className="pb-1 text-sm text-muted-foreground">/month</span>
              </>
            )}
          </div>
          <p className="mt-4 min-h-20 text-sm leading-6 text-muted-foreground">{plan.description}</p>
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm font-semibold text-[#17212b]">What’s included</p>
            <ul className="mt-4 space-y-3">
              {plan.features.map((feature) => (
                <li className="flex gap-3 text-sm leading-5 text-[#344050]" key={feature}>
                  <Check aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={17} strokeWidth={2.5} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-auto pt-7">
            <ButtonLink href={plan.ctaHref} variant={plan.featured ? "primary" : "secondary"}>
              {plan.ctaLabel}
            </ButtonLink>
          </div>
        </article>
      ))}
    </div>
  );
}

export function PricingPlansToggle({
  providerPlans,
  caseManagerPlans,
  initialAudience
}: {
  providerPlans: PricingPlan[];
  caseManagerPlans: PricingPlan[];
  initialAudience: PricingAudience;
}) {
  const [audience, setAudience] = useState<PricingAudience>(initialAudience);

  useEffect(() => {
    const syncAudienceWithHash = () => {
      setAudience(window.location.hash === "#case-managers" ? "case-managers" : "providers");
    };

    syncAudienceWithHash();
    window.addEventListener("hashchange", syncAudienceWithHash);
    return () => window.removeEventListener("hashchange", syncAudienceWithHash);
  }, []);

  function selectAudience(nextAudience: PricingAudience) {
    setAudience(nextAudience);
    const url = new URL(window.location.href);
    url.searchParams.set("audience", nextAudience);
    url.hash = nextAudience;
    window.history.replaceState(null, "", url);
  }

  const showingProviders = audience === "providers";

  return (
    <section className="relative border-b border-border bg-[#f8fafc] py-16 sm:py-20">
      <span className="absolute top-0 scroll-mt-24" id="providers" />
      <span className="absolute top-0 scroll-mt-24" id="case-managers" />
      <div className="shell">
        <div className="flex justify-center">
          <div className="inline-grid grid-cols-2 rounded-2xl border border-border bg-white p-1.5 shadow-sm" role="tablist" aria-label="Pricing audience">
            <button
              aria-controls="pricing-table"
              aria-selected={showingProviders}
              className={cn(
                "focus-ring rounded-xl px-5 py-3 text-sm font-semibold transition-colors sm:px-8",
                showingProviders ? "shadow-sm" : "hover:bg-[#f4f8ff]"
              )}
              onClick={() => selectAudience("providers")}
              role="tab"
              style={{
                backgroundColor: showingProviders ? "#10195e" : "#ffffff",
                color: showingProviders ? "#ffffff" : "#17212b"
              }}
              type="button"
            >
              Provider plans
            </button>
            <button
              aria-controls="pricing-table"
              aria-selected={!showingProviders}
              className={cn(
                "focus-ring rounded-xl px-5 py-3 text-sm font-semibold transition-colors sm:px-8",
                !showingProviders ? "shadow-sm" : "hover:bg-[#f4f8ff]"
              )}
              onClick={() => selectAudience("case-managers")}
              role="tab"
              style={{
                backgroundColor: !showingProviders ? "#10195e" : "#ffffff",
                color: !showingProviders ? "#ffffff" : "#17212b"
              }}
              type="button"
            >
              Case manager plans
            </button>
          </div>
        </div>

        <div className="mt-12" id="pricing-table" role="tabpanel">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              {showingProviders ? "For recovery programs" : "For care coordination teams"}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#17212b] sm:text-4xl">
              {showingProviders ? "Provider plans" : "Case manager plans"}
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              {showingProviders
                ? "From a free claimed listing to a network-wide referral operation."
                : "Search, refer, track, and collaborate with plans that scale from small teams to health systems."}
            </p>
          </div>
          <PricingCards
            columns={showingProviders ? "four" : "three"}
            plans={showingProviders ? providerPlans : caseManagerPlans}
          />
        </div>
      </div>
    </section>
  );
}
