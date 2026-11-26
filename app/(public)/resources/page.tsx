import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { ResourcesBrowser } from "@/components/resources/resources-browser";
import { publicSeoUrl } from "@/lib/profile-seo";
import { normalizeResourceTab, resourceStates } from "@/lib/resources/catalog";
import { requestResourceState } from "@/lib/resources/request-state";
import { firstParam, resourceCanonicalPath } from "@/lib/resources/state-choice";

export const dynamic = "force-dynamic";

const description =
  "Find official housing, food, shelter, employment, transit, recovery meetings, family support, veterans and first responder services, recovery-house licensing, and funding pages by state.";

type PageProps = { searchParams: Promise<{ state?: string | string[]; tab?: string | string[]; q?: string | string[] }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: "Resources | Aftercare Compass",
    description,
    alternates: {
      canonical: publicSeoUrl(resourceCanonicalPath("/resources", params, resourceStates.map((state) => state.code), normalizeResourceTab))
    }
  };
}

export default async function ResourcesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const stateChoice = await requestResourceState(resourceStates.map((state) => state.code), firstParam(params.state));

  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="ac-public-hero">
          <div className="shell relative py-10 lg:py-14">
            <div className="max-w-3xl">
              <p className="ac-public-kicker">Resources</p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl">
                Find official help
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                Housing, food, shelter, work, transit, recovery meetings, family support, veterans and first responder services, recovery-house licensing, and funding. Choose a state and a topic, or search by keyword.
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
            <ResourcesBrowser stateChoice={stateChoice} />
          </Suspense>
        </section>
      </main>
    </>
  );
}
