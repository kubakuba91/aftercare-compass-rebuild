import type { Metadata } from "next";
import { CheckCircle2, ClipboardList, FileText, Home, Info, PiggyBank, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { ResourceLinkCard } from "@/components/resources/resource-link-card";
import { StateResourcePicker } from "@/components/resources/state-resource-picker";
import { ButtonLink } from "@/components/ui/button-link";
import { dashboardAppUrl, publicAppUrl } from "@/lib/app-urls";
import { generalFaq, narrChecklist, standardsLinks, templateOutlines } from "@/lib/recovery-housing/general";
import { findStateResource, stateResources } from "@/lib/recovery-housing/states";
import type { ResourceLink } from "@/lib/recovery-housing/types";

export const metadata: Metadata = {
  title: "Recovery House Owner Resources | Aftercare Compass",
  description:
    "Plain-language resources for people opening or running a recovery or sober house: zoning basics, starter templates, NARR standards, funding, and state-by-state licensing and certification links."
};

const zoningLinks: ResourceLink[] = [
  {
    title: "Pennsylvania Uniform Construction Code (UCC)",
    href: "https://www.pa.gov/agencies/dli/programs-services/labor-management-relations/bureau-of-occupational-and-industrial-safety/uniform-construction-code-home",
    source: "pa.gov · Department of Labor & Industry",
    description: "Example: Pennsylvania’s statewide building code and who enforces it locally."
  },
  {
    title: "UCC status and code official contacts by municipality",
    href: "https://www.pa.gov/content/dam/copapwp-pagov/en/dli/documents/individuals/labor-management-relations/bois/documents/uccmun.htm",
    source: "pa.gov · Department of Labor & Industry",
    description: "Example: find the building code contact for a Pennsylvania municipality."
  },
  {
    title: "Lancaster County Planning Department",
    href: "https://lancastercountyplanning.org/",
    source: "lancastercountyplanning.org",
    description: "Example: Lancaster County’s 60 municipalities each set their own zoning."
  }
];

const zoningChecks = [
  "Ask the municipal zoning officer how a recovery or sober house is classified in that zoning district, and whether it’s allowed by right or needs a special approval.",
  "Ask about occupancy limits, including any limit on unrelated people living together, parking, and permits you’ll need.",
  "Ask the building code official and fire department about inspections, smoke and carbon monoxide detectors, exits, and any changes the house would need.",
  "Compare the house with your state’s recovery residence rules (for example, bedroom size and exits) before you commit.",
  "Get answers in writing when you can, and confirm everything with your municipality before you sign a lease or buy."
];

type PageProps = { searchParams: Promise<{ state?: string | string[] }> };

export default async function RecoveryHouseOwnersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = Array.isArray(params.state) ? params.state[0] : params.state;
  const initialState = findStateResource(requested);

  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="relative border-b border-border bg-[#f4f8ff]">
          <div className="pointer-events-none absolute -right-32 -top-44 size-[34rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="shell relative py-16 lg:py-24">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Resources · For recovery house owners</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl lg:text-6xl">
                Opening or running a recovery house?
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Plain-language basics for owners and operators: zoning, starter templates, quality standards, funding, and the
                licensing or certification rules in your state.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="#state">Find your state’s rules</ButtonLink>
                <ButtonLink href="#templates" variant="secondary">
                  See starter templates
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className="shell py-10">
          <div className="flex gap-4 rounded-2xl border border-[#f3d48a] bg-[#fff8e6] p-5 text-[#5b4300]">
            <Info aria-hidden="true" className="mt-0.5 shrink-0" size={22} />
            <p className="text-sm leading-6">
              <strong className="font-semibold">Always check with your state agency for current requirements.</strong> This page is a
              general summary to help you find official sources. It is not legal advice, and rules, forms, and fees change.
            </p>
          </div>
        </section>

        <section className="shell scroll-mt-24 py-10 lg:py-14" id="state">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">By state</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Licensing and certification in your state</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            Every state handles recovery housing differently. Some require a license, some certify homes voluntarily, and some tie
            referrals or public funding to certification.
          </p>
          <div className="mt-8">
            <StateResourcePicker initialCode={initialState?.code} states={stateResources} />
          </div>
        </section>

        <section className="border-y border-border bg-[#f4f8ff]">
          <div className="shell grid gap-10 py-16 lg:grid-cols-[0.7fr_1.3fr] lg:py-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Before you sign a lease</p>
              <h2 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">
                <Home aria-hidden="true" className="text-primary" size={30} /> Local zoning and occupancy
              </h2>
            </div>
            <div className="max-w-3xl">
              <p className="text-lg leading-8 text-muted-foreground">
                Zoning, occupancy limits, and building and fire codes are set locally and vary from one municipality to the next.
                Check them before you commit to a property.
              </p>
              <ul className="mt-6 space-y-3">
                {zoningChecks.map((item) => (
                  <li key={item} className="flex gap-3 text-base leading-7 text-[#17212b]">
                    <CheckCircle2 aria-hidden="true" className="mt-1 shrink-0 text-primary" size={20} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {zoningLinks.map((link) => (
                  <ResourceLinkCard key={link.href} link={link} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="shell grid gap-10 py-16 lg:grid-cols-[0.7fr_1.3fr] lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Funding</p>
            <h2 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">
              <PiggyBank aria-hidden="true" className="text-primary" size={30} /> How funding usually works
            </h2>
          </div>
          <div className="max-w-3xl space-y-5 text-lg leading-8 text-muted-foreground">
            <p>
              In many states, public money and state-agency referrals depend on licensing or certification. For example,
              Pennsylvania only lets licensed houses receive state or federal recovery housing funds; Delaware bars uncertified
              houses from accepting state or local funding; and West Virginia, Massachusetts, Florida, and Ohio limit certain
              referrals to certified or registered homes. Pick your state above for the details and sources.
            </p>
            <p>
              Your county or regional behavioral health office (in Pennsylvania, the Single County Authority) is usually the best
              place to ask about local recovery housing funds, such as Lancaster County’s Recovery House Scholarship program.
            </p>
          </div>
        </section>

        <section className="scroll-mt-24 border-y border-border bg-[#f4f8ff]" id="templates">
          <div className="shell py-16 lg:py-20">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Starter templates</p>
            <h2 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">
              <FileText aria-hidden="true" className="text-primary" size={30} /> Outlines to build your policies from
            </h2>
            <p className="mt-4 max-w-3xl rounded-2xl border border-[#f3d48a] bg-[#fff8e6] p-4 text-sm leading-6 text-[#5b4300]">
              <strong className="font-semibold">Starting points only.</strong> These are outlines, not legal documents. Review your
              final policies with an attorney and make sure they match your state’s requirements. In Pennsylvania, align them with
              28 Pa. Code Chapter 717; the related sections are noted on each item.
            </p>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {templateOutlines.map((outline) => (
                <article key={outline.title} className="flex flex-col rounded-2xl border border-border bg-white p-6">
                  <ClipboardList aria-hidden="true" className="text-primary" size={24} />
                  <h3 className="mt-4 text-xl font-semibold text-[#17212b]">{outline.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{outline.intro}</p>
                  <ul className="mt-5 space-y-3">
                    {outline.items.map((item) => (
                      <li key={item.text} className="flex gap-2 text-sm leading-6 text-[#17212b]">
                        <CheckCircle2 aria-hidden="true" className="mt-1 shrink-0 text-primary" size={16} />
                        <span>
                          {item.text}
                          {item.paReference ? (
                            <span className="block text-xs text-muted-foreground">PA: 28 Pa. Code {item.paReference}</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-16 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Quality standards</p>
          <h2 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">
            <ShieldCheck aria-hidden="true" className="text-primary" size={30} /> NARR standards checklist
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            The National Alliance for Recovery Residences (NARR) Standard 3.0 is organized into four domains and ten principles.
            State affiliates certify homes against it. Use this as a self-check, then read the full standard.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {narrChecklist.map((group) => (
              <article key={group.domain} className="rounded-2xl border border-border bg-white p-6">
                <h3 className="text-lg font-semibold text-[#17212b]">{group.domain}</h3>
                <ul className="mt-4 space-y-2">
                  {group.principles.map((principle) => (
                    <li key={principle} className="flex gap-2 text-sm leading-6 text-[#17212b]">
                      <CheckCircle2 aria-hidden="true" className="mt-1 shrink-0 text-primary" size={16} />
                      <span>{principle}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {standardsLinks.map((link) => (
              <ResourceLinkCard key={link.href} link={link} />
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-[#f4f8ff]">
          <div className="shell py-16 lg:py-20">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">FAQ</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Common questions</h2>
            <div className="mt-8 max-w-3xl divide-y divide-border rounded-2xl border border-border bg-white">
              {generalFaq.map((item) => (
                <details key={item.question} className="p-5">
                  <summary className="focus-ring cursor-pointer list-none rounded-md text-base font-semibold text-[#17212b]">{item.question}</summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                  <span className="mt-1 block text-xs font-medium text-muted-foreground">Source: {item.source}</span>
                </details>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">State-specific questions are in each state’s section above.</p>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="shell py-16 text-center sm:py-20">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Get your house in front of referrers</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Aftercare Compass helps social workers, case managers, and discharge planners find recovery housing with real-time
              availability. Claim or create your profile and keep it current as you work toward licensing or certification.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href={publicAppUrl("/search")}>Find your listing</ButtonLink>
              <ButtonLink href={dashboardAppUrl("/sign-up")} variant="secondary">
                List your program
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
