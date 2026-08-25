import type { LucideIcon } from "lucide-react";
import { Quote } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingVideoCard } from "@/components/marketing-video-card";
import { ButtonLink } from "@/components/ui/button-link";

type Benefit = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type Step = {
  title: string;
  description: string;
};

export function AudienceMarketingPage({
  audienceLabel,
  headline,
  subhead,
  primaryCta,
  video,
  problem,
  benefits,
  pricing,
  steps,
  testimonialTitle,
  testimonialPlaceholder,
  showTestimonials = false,
  closing
}: {
  audienceLabel: string;
  headline: string;
  subhead: string;
  primaryCta: { label: string; href: string };
  video: { caption: string; eyebrow: string; title: string; url?: string };
  problem: { title: string; lead: string; paragraphs: string[] };
  benefits: Benefit[];
  pricing: { description: string; ctaLabel: string; ctaHref: string };
  steps: Step[];
  testimonialTitle: string;
  testimonialPlaceholder: string;
  showTestimonials?: boolean;
  closing: { title: string; description: string; ctaLabel: string; ctaHref: string };
}) {
  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="relative border-b border-border bg-[#f4f8ff]">
          <div className="pointer-events-none absolute -right-32 -top-44 size-[34rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="shell relative grid items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">{audienceLabel}</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl lg:text-6xl">
                {headline}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{subhead}</p>
              <div className="mt-8">
                <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
              </div>
            </div>
            <MarketingVideoCard {...video} videoUrl={video.url} />
          </div>
        </section>

        <section className="shell grid gap-10 py-20 lg:grid-cols-[0.7fr_1.3fr] lg:py-28">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">The challenge</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">{problem.title}</h2>
          </div>
          <div className="max-w-3xl space-y-6 text-lg leading-8 text-muted-foreground">
            <p className="text-2xl font-semibold leading-9 text-[#17212b]">{problem.lead}</p>
            {problem.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>

        <section className="bg-[#10195e] text-white">
          <div className="shell py-20 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8eb8ff]">Everything in one place</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">What You Get</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-2xl border border-white/15 bg-white/[0.07] p-6">
                  <Icon aria-hidden="true" className="text-[#8eb8ff]" size={25} />
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-20 lg:py-28">
          <div className="grid items-start gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Three simple steps</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">How It Works</h2>
              <ol className="mt-8 space-y-4">
                {steps.map((step, index) => (
                  <li key={step.title} className="grid grid-cols-[3rem_1fr] gap-4 rounded-2xl border border-border p-5">
                    <span className="grid size-12 place-items-center rounded-full bg-primary/10 font-bold text-primary">{index + 1}</span>
                    <div>
                      <h3 className="font-semibold text-[#17212b]">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Plans for every team</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Simple, flexible pricing</h2>
              <aside id="pricing" className="mt-8 h-fit scroll-mt-24 rounded-[1.5rem] border border-[#cddcf4] bg-[#f4f8ff] p-7 sm:p-9">
                <p className="leading-7 text-muted-foreground">{pricing.description}</p>
                <div className="mt-7">
                  <ButtonLink href={pricing.ctaHref}>{pricing.ctaLabel}</ButtonLink>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {showTestimonials ? (
          <section className="border-y border-border bg-[#f8fafc]">
            <div className="shell py-16 text-center sm:py-20">
              <Quote aria-hidden="true" className="mx-auto text-primary" size={30} />
              <h2 className="mt-5 text-2xl font-semibold text-[#17212b]">{testimonialTitle}</h2>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">{testimonialPlaceholder}</p>
            </div>
          </section>
        ) : null}

        <section className="bg-[#f4f8ff]">
          <div className="shell py-16 text-center sm:py-20">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">{closing.title}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{closing.description}</p>
            <div className="mt-8">
              <ButtonLink href={closing.ctaHref}>{closing.ctaLabel}</ButtonLink>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
