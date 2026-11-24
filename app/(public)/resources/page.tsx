import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { ResourcesBrowser } from "@/components/resources/resources-browser";

export const metadata: Metadata = {
  title: "Resources | Aftercare Compass",
  description:
    "Find official housing, food, shelter, employment, transit, recovery meetings, family support, veterans services, and recovery-house licensing pages by state."
};

export default function ResourcesPage() {
  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="relative border-b border-border bg-[#f4f8ff]">
          <div className="pointer-events-none absolute -right-32 -top-44 size-[34rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="shell relative py-10 lg:py-14">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Resources</p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl">
                Find official help
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                Housing, food, shelter, work, transit, recovery meetings, family support, veterans services, and recovery-house licensing. Choose a state and a topic, or search by keyword.
              </p>
              <p className="mt-3 text-sm font-semibold text-[#17212b]">
                <Link className="focus-ring rounded-md text-primary underline-offset-4 hover:underline" href="/resources/recovery-house-owners">
                  Full owner guide
                </Link>
                <span className="px-2 text-muted-foreground">·</span>
                <Link className="focus-ring rounded-md text-primary underline-offset-4 hover:underline" href="/resources/community">
                  Full community guide
                </Link>
              </p>
            </div>
          </div>
        </section>
        <section className="shell py-8 lg:py-10">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading resources…</p>}>
            <ResourcesBrowser />
          </Suspense>
        </section>
      </main>
    </>
  );
}
