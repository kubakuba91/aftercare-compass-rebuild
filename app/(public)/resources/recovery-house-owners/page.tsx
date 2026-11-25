import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2, ClipboardList, FileText, Home, Info, PiggyBank, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { OwnerGuideNav } from "@/components/resources/owner-guide-nav";
import { ResourceLinkCard } from "@/components/resources/resource-link-card";
import { StateResourceSection } from "@/components/resources/state-resource-section";
import { ButtonLink } from "@/components/ui/button-link";
import { dashboardAppUrl, publicAppUrl } from "@/lib/app-urls";
import { ownerFundingGaps } from "@/lib/recovery-housing/funding";
import { generalFaq, narrChecklist, standardsLinks, templateOutlines } from "@/lib/recovery-housing/general";
import { includesQuery, linkSearchText, normalizeOwnerGuideTab, stateSearchText, type OwnerGuideTab } from "@/lib/recovery-housing/owner-guide";
import { findStateResource, stateResources } from "@/lib/recovery-housing/states";
import type { ResourceLink } from "@/lib/recovery-housing/types";
import { filterResources, resourceCatalog } from "@/lib/resources/catalog";

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

const zoningIntro =
  "Zoning, occupancy limits, and building and fire codes are set locally and vary from one municipality to the next. Check them before you commit to a property.";

const zoningChecks = [
  "Ask the municipal zoning officer how a recovery or sober house is classified in that zoning district, and whether it’s allowed by right or needs a special approval.",
  "Ask about occupancy limits, including any limit on unrelated people living together, parking, and permits you’ll need.",
  "Ask the building code official and fire department about inspections, smoke and carbon monoxide detectors, exits, and any changes the house would need.",
  "Compare the house with your state’s recovery residence rules (for example, bedroom size and exits) before you commit.",
  "Get answers in writing when you can, and confirm everything with your municipality before you sign a lease or buy."
];

type PageProps = { searchParams: Promise<{ state?: string | string[]; tab?: string | string[]; q?: string | string[] }> };

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RecoveryHouseOwnersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedState = findStateResource(firstParam(params.state));
  const stateCode = selectedState?.code ?? "all";
  const requestedTab = firstParam(params.tab);
  const tab: OwnerGuideTab = normalizeOwnerGuideTab(requestedTab);
  const query = firstParam(params.q) ?? "";
  const active = (id: OwnerGuideTab) => tab === "all" || tab === id;
  const querySet = query.trim().length > 0;

  const licensingIntro =
    "Every state handles recovery housing differently. Some require a license, some certify homes voluntarily, and some tie referrals or public funding to certification.";
  const licensingStates = stateResources.filter((state) => {
    if (stateCode !== "all" && state.code !== stateCode) return false;
    if (!querySet) return stateCode !== "all";
    if (stateCode !== "all" && includesQuery(licensingIntro, query)) return true;
    return includesQuery(stateSearchText(state), query);
  });
  const showLicensing = active("licensing") && (!querySet || includesQuery(licensingIntro, query) || licensingStates.length > 0);

  const showZoningLinks = stateCode === "all" || stateCode === "PA";
  const zoningText = [zoningIntro, ...zoningChecks, ...(showZoningLinks ? zoningLinks.map(linkSearchText) : [])].join(" ");
  const showZoning = active("zoning") && includesQuery(zoningText, query);

  const fundingIntro =
    "In many states, public money and state-agency referrals depend on licensing or certification. For example, Pennsylvania only lets licensed houses receive state or federal recovery housing funds; Delaware bars uncertified houses from accepting state or local funding; and West Virginia, Massachusetts, Florida, and Ohio limit certain referrals to certified or registered homes. Pick your state above for the details and sources. Your county or regional behavioral health office (in Pennsylvania, the Single County Authority) is usually the best place to ask about local recovery housing funds, such as Lancaster County’s Recovery House Scholarship program. Standing pages from SAMHSA and state substance-use agencies. These are where new announcements are posted. They are not a list of past awards. Read the current notice before you apply, because eligibility and deadlines change.";
  const gapNames = stateCode === "all" ? ownerFundingGaps : ownerFundingGaps.filter((name) => name === selectedState?.name);
  const fundingCatalogText = resourceCatalog
    .filter((entry) => entry.category === "funding")
    .map((entry) => `${entry.title} ${entry.description} ${entry.source}`)
    .join(" ");
  const fundingText = [fundingIntro, fundingCatalogText, gapNames.join(", ")].join(" ");
  const showFunding = active("funding") && includesQuery(fundingText, query);
  const matchedFunding = filterResources(resourceCatalog, { state: stateCode, category: "funding", query });
  const fundingEntries = !querySet || matchedFunding.length > 0
    ? matchedFunding
    : filterResources(resourceCatalog, { state: stateCode, category: "funding", query: "" });
  const fundingGroups = stateCode === "all"
    ? [
        { label: "National", items: fundingEntries.filter((entry) => !entry.state) },
        ...Array.from(
          fundingEntries
            .filter((entry) => entry.state)
            .reduce((groups, entry) => {
              const label = entry.stateName ?? entry.state ?? "State";
              groups.set(label, [...(groups.get(label) ?? []), entry]);
              return groups;
            }, new Map<string, typeof fundingEntries>())
        ).map(([label, items]) => ({ label, items }))
      ].filter((group) => group.items.length > 0)
    : [
        { label: selectedState?.name ?? stateCode, items: fundingEntries.filter((entry) => entry.state) },
        { label: "National", items: fundingEntries.filter((entry) => !entry.state) }
      ].filter((group) => group.items.length > 0);

  const templateText = templateOutlines
    .flatMap((outline) => [outline.title, outline.intro, ...outline.items.map((item) => item.text)])
    .join(" ");
  const showTemplates = active("templates") && includesQuery(`Starter templates Outlines to build your policies from ${templateText}`, query);

  const narrAffiliateText = selectedState
    ? [selectedState.narrNote, selectedState.narrAffiliate?.title, selectedState.narrAffiliate?.description, selectedState.narrAffiliate?.source].filter(Boolean).join(" ")
    : "";
  const standardsText = [
    "NARR standards checklist",
    ...narrChecklist.flatMap((group) => [group.domain, ...group.principles]),
    ...standardsLinks.map(linkSearchText),
    tab === "standards" ? narrAffiliateText : ""
  ].join(" ");
  const showStandards = active("standards") && includesQuery(standardsText, query);

  const faqText = [
    ...generalFaq.flatMap((item) => [item.question, item.answer]),
    "State-specific questions are in each state’s section above.",
    ...(tab === "faq" && selectedState?.faq ? selectedState.faq.flatMap((item) => [item.question, item.answer]) : [])
  ].join(" ");
  const showFaq = active("faq") && includesQuery(faqText, query);
  const showStateFaq = showFaq && tab === "faq" && Boolean(selectedState?.faq?.length);
  const anySection = showLicensing || showZoning || showFunding || showTemplates || showStandards || showFaq;

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
                <ButtonLink href="/resources/recovery-house-owners?tab=licensing#state">Find your state’s rules</ButtonLink>
                <ButtonLink href="/resources/recovery-house-owners?tab=funding#funding" variant="secondary">
                  Funding and grants
                </ButtonLink>
                <ButtonLink href={publicAppUrl("/resources/community")} variant="secondary">
                  Community resources
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

        <section className="shell pb-4 pt-10">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading guide…</p>}>
            <OwnerGuideNav states={stateResources.map((state) => ({ code: state.code, name: state.name }))} />
          </Suspense>
        </section>

        <div aria-labelledby={`owner-tab-${tab}`} id="owner-guide-results" role="tabpanel">
        {showLicensing ? (
        <section className="shell scroll-mt-24 py-10 lg:py-14" id="state">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">By state</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Licensing and certification in your state</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            Every state handles recovery housing differently. Some require a license, some certify homes voluntarily, and some tie
            referrals or public funding to certification.
          </p>
          {licensingStates.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border bg-[#f4f8ff] p-6 text-base text-muted-foreground">
              Pick a state to see its licensing or certification body, official links, local offices, NARR affiliate, and funding notes.
            </p>
          ) : (
            licensingStates.map((state) => <StateResourceSection key={state.code} state={state} />)
          )}
        </section>
        ) : null}

        {showZoning ? (
        <section className="scroll-mt-24 border-y border-border bg-[#f4f8ff]" id="zoning">
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
              {showZoningLinks ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {zoningLinks.map((link) => (
                  <ResourceLinkCard key={link.href} link={link} />
                ))}
              </div>
              ) : null}
            </div>
          </div>
        </section>
        ) : null}

        {showFunding ? (
        <>
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

        <section className="shell scroll-mt-24 py-16 lg:py-20" id="funding">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Grants</p>
          <h2 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">
            <PiggyBank aria-hidden="true" className="text-primary" size={30} /> Funding and grants for recovery house owners
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            Standing pages from SAMHSA and state substance-use agencies. These are where new announcements are posted. They are not
            a list of past awards. Read the current notice before you apply, because eligibility and deadlines change.
          </p>
          {fundingGroups.map((group) => (
            <div key={group.label}>
              <h3 className="mt-10 text-xl font-semibold text-[#17212b]">{group.label}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {group.items.map((entry) => (
                  <ResourceLinkCard
                    key={entry.id}
                    link={{ title: entry.title, href: entry.url, source: entry.source, description: entry.description }}
                  />
                ))}
              </div>
            </div>
          ))}
          {gapNames.length > 0 ? (
          <p className="mt-6 max-w-3xl text-sm leading-6 text-muted-foreground">
            No standing funding-board page was verified for {gapNames.join(", ")}. Use that state’s licensing or
            certification agency in the picker above, and check SAMHSA’s grants page for federal notices.
          </p>
          ) : null}
        </section>
        </>
        ) : null}

        {showTemplates ? (
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

        ) : null}

        {showStandards ? (
        <section className="shell scroll-mt-24 py-16 lg:py-20" id="standards">
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
          {tab === "standards" && selectedState && (selectedState.narrAffiliate || selectedState.narrNote) ? (
            <div className="mt-10">
              <h3 className="text-lg font-semibold text-[#17212b]">NARR state affiliate</h3>
              {selectedState.narrAffiliate ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <ResourceLinkCard link={selectedState.narrAffiliate} />
                </div>
              ) : (
                <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{selectedState.narrNote}</p>
              )}
            </div>
          ) : null}
        </section>
        ) : null}

        {showFaq ? (
        <section className="scroll-mt-24 border-t border-border bg-[#f4f8ff]" id="faq">
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
            {showStateFaq && selectedState?.faq ? (
              <div className="mt-8 max-w-3xl">
                <h3 className="text-lg font-semibold text-[#17212b]">{selectedState.name} FAQ</h3>
                <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-white">
                  {selectedState.faq.map((item) => (
                    <details key={item.question} className="p-5">
                      <summary className="focus-ring cursor-pointer list-none rounded-md text-base font-semibold text-[#17212b]">{item.question}</summary>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                      <span className="mt-1 block text-xs font-medium text-muted-foreground">Source: {item.source}</span>
                    </details>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
        ) : null}

        {anySection ? null : (
          <div className="shell py-10">
            <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
              <p className="text-lg font-semibold text-[#17212b]">No sections match that search.</p>
              <p className="mt-2 text-sm text-muted-foreground">Try another word, or clear the search.</p>
            </div>
          </div>
        )}
        </div>

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
