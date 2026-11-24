import type { Metadata } from "next";
import { ArrowUpRight, Home, Users } from "lucide-react";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { publicAppUrl } from "@/lib/app-urls";

export const metadata: Metadata = {
  title: "Resources | Aftercare Compass",
  description: "Resources for recovery house owners and for people leaving treatment, including housing, jobs, food, and transit."
};

const pages = [
  {
    href: publicAppUrl("/resources/recovery-house-owners"),
    icon: Home,
    eyebrow: "For owners and operators",
    title: "Recovery house owner resources",
    description: "Licensing and certification by state, the Pennsylvania DDAP workshop and correspondence list, funding pages, and starter templates."
  },
  {
    href: publicAppUrl("/resources/community"),
    icon: Users,
    eyebrow: "For people leaving treatment",
    title: "Community resources",
    description: "Housing, jobs, food, and transit, starting with Pennsylvania and Central PA, plus statewide help in the other states we list."
  }
];

export default function ResourcesPage() {
  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="relative border-b border-border bg-[#f4f8ff]">
          <div className="pointer-events-none absolute -right-32 -top-44 size-[34rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="shell relative py-16 lg:py-24">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Resources</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl lg:text-6xl">Find the official page you need</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Two starting points: one for people opening or running a recovery house, and one for people leaving treatment who need housing, work, food, or a way to get there.
              </p>
            </div>
          </div>
        </section>

        <section className="shell py-16 lg:py-20">
          <div className="grid gap-4 md:grid-cols-2">
            {pages.map((page) => {
              const Icon = page.icon;
              return (
                <Link
                  className="focus-ring group flex h-full flex-col rounded-2xl border border-border bg-white p-6 transition hover:border-primary/40 hover:shadow-[0_12px_32px_rgba(23,33,43,0.08)]"
                  href={page.href}
                  key={page.href}
                >
                  <Icon aria-hidden="true" className="text-primary" size={24} />
                  <span className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{page.eyebrow}</span>
                  <span className="mt-2 flex items-start justify-between gap-3 text-2xl font-semibold tracking-[-0.02em] text-[#17212b]">
                    {page.title}
                    <ArrowUpRight aria-hidden="true" className="mt-1 shrink-0 text-muted-foreground group-hover:text-primary" size={20} />
                  </span>
                  <span className="mt-3 text-base leading-7 text-muted-foreground">{page.description}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
