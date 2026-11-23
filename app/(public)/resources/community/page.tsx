import type { Metadata } from "next";
import { Bus, Info, Phone } from "lucide-react";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { ResourceLinkCard } from "@/components/resources/resource-link-card";
import { publicAppUrl } from "@/lib/app-urls";
import { centralPennsylvania, crisisLinks, nationalLinks, otherStates, pennsylvaniaGroups, type CommunityGroup } from "@/lib/community-resources/content";

export const metadata: Metadata = {
  title: "Community Resources | Aftercare Compass",
  description:
    "Housing, jobs, food, and transit for people leaving treatment, starting with Pennsylvania and Central PA, plus statewide resources in other states."
};

function LinkGrid({ links }: { links: CommunityGroup["links"] }) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {links.map((link) => (
        <ResourceLinkCard key={link.href} link={link} />
      ))}
    </div>
  );
}

function Groups({ groups }: { groups: CommunityGroup[] }) {
  return (
    <div className="mt-8 space-y-8">
      {groups.map((group) => (
        <div key={group.title}>
          <h3 className="text-xl font-semibold text-[#17212b]">{group.title}</h3>
          <LinkGrid links={group.links} />
        </div>
      ))}
    </div>
  );
}

export default function CommunityResourcesPage() {
  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="relative border-b border-border bg-[#f4f8ff]">
          <div className="pointer-events-none absolute -right-32 -top-44 size-[34rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="shell relative py-16 lg:py-24">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Resources · Leaving treatment</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl lg:text-6xl">Housing, work, food, and a way to get there</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Official pages and established helplines for people leaving treatment. Pennsylvania and Central PA (Harrisburg, Lancaster, York, and Reading) are listed first. Other states are statewide.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#17212b]">
                <Link className="focus-ring rounded-md text-primary underline-offset-4 hover:underline" href={publicAppUrl("/resources")}>
                  All resources
                </Link>
                <span className="px-2 text-muted-foreground">·</span>
                <Link className="focus-ring rounded-md text-primary underline-offset-4 hover:underline" href={publicAppUrl("/resources/recovery-house-owners")}>
                  For recovery house owners
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className="shell py-10">
          <div className="flex gap-4 rounded-2xl border border-[#f3d48a] bg-[#fff8e6] p-5 text-[#5b4300]">
            <Info aria-hidden="true" className="mt-0.5 shrink-0" size={22} />
            <p className="text-sm leading-6">
              <strong className="font-semibold">If this is an emergency, call 911.</strong> This page points to public programs. It does not list private client information, and a program’s rules can change.
            </p>
          </div>
        </section>

        <section className="shell scroll-mt-24 pb-10" id="help-now">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Help now</p>
          <h2 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">
            <Phone aria-hidden="true" className="text-primary" size={30} /> Get Help Now and 988
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            In Pennsylvania, call <strong className="font-semibold text-[#17212b]">1-800-662-HELP (4357)</strong> or text{" "}
            <strong className="font-semibold text-[#17212b]">717-216-0905</strong>. Anywhere in the United States, call or text{" "}
            <strong className="font-semibold text-[#17212b]">988</strong>.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {crisisLinks.map((link) => (
              <ResourceLinkCard key={link.href} link={link} />
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-[#f4f8ff]">
          <div className="shell py-16 lg:py-20">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Anywhere</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">If your state section is missing a topic</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
              Start with 211, HUD’s shelter search, or the federal SNAP page. State sections below add the local agency when that page could be confirmed.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nationalLinks.map((link) => (
                <ResourceLinkCard key={link.href} link={link} />
              ))}
            </div>
          </div>
        </section>

        <section className="shell scroll-mt-24 py-16 lg:py-20" id="pennsylvania">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Pennsylvania</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Statewide</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            County assistance offices handle SNAP and other benefits in person. PA CareerLink is the statewide job system. Bus service depends on the county.
          </p>
          <Groups groups={pennsylvaniaGroups} />
        </section>

        <section className="border-y border-border bg-[#f4f8ff]">
          <div className="shell py-16 lg:py-20">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Central Pennsylvania</p>
            <h2 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">
              <Bus aria-hidden="true" className="text-primary" size={30} /> Harrisburg, Lancaster, York, and Reading
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
              rabbittransit runs buses in Harrisburg and York. The South Central Transit Authority runs Red Rose Transit in Lancaster and BARTA in Reading. SNAP, WIC, and PA CareerLink above cover all four places.
            </p>
            <div className="mt-10 space-y-10">
              {centralPennsylvania.map((place) => (
                <article key={place.name}>
                  <h3 className="text-2xl font-semibold tracking-[-0.02em] text-[#17212b]">{place.name}</h3>
                  <p className="mt-2 text-base leading-7 text-muted-foreground">{place.summary}</p>
                  <LinkGrid links={place.links} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-16 lg:py-20" id="other-states">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Other states</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Statewide resources</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            The same states as the recovery house owner picker, at a statewide level. Open a state for housing, jobs, food, and transit pages that could be confirmed.
          </p>
          <div className="mt-8 max-w-5xl divide-y divide-border rounded-2xl border border-border bg-white">
            {otherStates.map((state) => (
              <details className="p-5" key={state.code}>
                <summary className="focus-ring cursor-pointer list-none rounded-md text-lg font-semibold text-[#17212b]">
                  {state.name}
                  <span className="ml-2 text-sm font-medium text-muted-foreground">{state.code}</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{state.summary}</p>
                <Groups groups={state.groups} />
                {state.places?.length ? (
                  <div className="mt-8 space-y-8">
                    {state.places.map((place) => (
                      <article key={place.name}>
                        <h3 className="text-xl font-semibold text-[#17212b]">{place.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{place.summary}</p>
                        <LinkGrid links={place.links} />
                      </article>
                    ))}
                  </div>
                ) : null}
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
