import type { Metadata } from "next";
import { ArrowUpRight, Building2, ClipboardCheck, FileText, Info, MapPin, Scale, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { ButtonLink } from "@/components/ui/button-link";
import { dashboardAppUrl, publicAppUrl } from "@/lib/app-urls";

export const metadata: Metadata = {
  title: "Pennsylvania Recovery House Licensing (DDAP) | Aftercare Compass",
  description:
    "A plain-language guide to Pennsylvania DDAP recovery house licensing for people opening a sober or recovery house: who needs a license, the basic steps, and official links."
};

// Every link below was checked live against the official source before publishing.
// Requirements change — keep copy pointed at DDAP as the source of truth.
const ddapLicensingPage = "https://www.pa.gov/services/ddap/apply-to-become-a-licensed-recovery-house";
const ddapLicensingEmail = "ra-licensuredivision@pa.gov";

type ResourceLink = {
  title: string;
  description: string;
  href: string;
  source: string;
};

const officialLinks: { heading: string; icon: typeof FileText; links: ResourceLink[] }[] = [
  {
    heading: "Licensing and the application",
    icon: ClipboardCheck,
    links: [
      {
        title: "Apply to Become a Licensed Recovery House",
        description: "DDAP’s main page: who needs a license, the required documents, account setup, and contacts.",
        href: ddapLicensingPage,
        source: "pa.gov · DDAP"
      },
      {
        title: "Initial Provider Application (IPA) login",
        description: "The online system where you create an account and submit your recovery house application.",
        href: "https://sais.health.pa.gov/commonpoc/Licensing/IPA/Login.aspx",
        source: "sais.health.pa.gov · DDAP"
      },
      {
        title: "How to apply for recovery house licensure (PDF)",
        description: "A printable checklist of the documents you need and the account registration steps.",
        href: "https://www.pa.gov/content/dam/copapwp-pagov/en/ddap/documents/licensing/documents/recovery-house-licensing/how%20to%20apply%20for%20recovery%20house%20licensure.pdf",
        source: "pa.gov · DDAP"
      },
      {
        title: "Recovery house floor plan checklist (PDF)",
        description: "What DDAP looks for in the floor plans you upload with your application.",
        href: "https://www.pa.gov/content/dam/copapwp-pagov/en/ddap/documents/licensing/documents/recovery-house-licensing/recovery%20house%20floor%20plan%20checklist.pdf",
        source: "pa.gov · DDAP"
      }
    ]
  },
  {
    heading: "The law and the regulations",
    icon: Scale,
    links: [
      {
        title: "Act 59 of 2017 (recovery house law)",
        description: "The state law that directs DDAP to license recovery houses and sets the funding and referral rules.",
        href: "https://www.palegis.us/statutes/unconsolidated/law-information?actNum=59&sessInd=0&sessYr=2017",
        source: "palegis.us · PA General Assembly"
      },
      {
        title: "28 Pa. Code Chapter 717 — Standards for Drug and Alcohol Recovery House Licensure",
        description: "The full licensing regulations: applications, inspections, house managers, resident rights, safety, and more.",
        href: "https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/028/chapter717/chap717toc.html",
        source: "pacodeandbulletin.gov"
      }
    ]
  },
  {
    heading: "Funding and referrals",
    icon: FileText,
    links: [
      {
        title: "Recovery House Licensure FAQs (PDF)",
        description:
          "DDAP’s answers on funding, referrals, what counts as a recovery house, and the inspection process.",
        href: "https://www.pa.gov/content/dam/copapwp-pagov/en/ddap/documents/licensing/documents/recovery-house-licensing/recovery%20house%20faq.pdf",
        source: "pa.gov · DDAP"
      },
      {
        title: "DDAP recovery and halfway housing",
        description: "DDAP’s overview of recovery housing and halfway housing in Pennsylvania.",
        href: "https://www.pa.gov/agencies/ddap/treatment-and-support/housing",
        source: "pa.gov · DDAP"
      }
    ]
  },
  {
    heading: "Find licensed houses",
    icon: MapPin,
    links: [
      {
        title: "DDAP Drug and Alcohol Facility Locator",
        description: "Search licensed recovery houses and treatment facilities by county, distance, facility type, or name.",
        href: "https://sais.health.pa.gov/commonpoc/Content/PublicWeb/DAFind.aspx",
        source: "sais.health.pa.gov · DDAP"
      }
    ]
  },
  {
    heading: "Voluntary certification",
    icon: ShieldCheck,
    links: [
      {
        title: "PARR certification application process",
        description:
          "The Pennsylvania Alliance of Recovery Residences (PARR) certifies houses to the national NARR Standard. It is voluntary and separate from DDAP licensing.",
        href: "https://www.parronline.org/application-process",
        source: "parronline.org · PARR"
      },
      {
        title: "National Alliance for Recovery Residences (NARR)",
        description: "The national organization that sets the NARR Standard used by state affiliates like PARR.",
        href: "https://narronline.org/",
        source: "narronline.org · NARR"
      }
    ]
  }
];

const steps = [
  {
    title: "Read the rules first",
    description:
      "Start with DDAP’s licensing page and 28 Pa. Code Chapter 717 so you know the standards your house, policies, and staff will be held to."
  },
  {
    title: "Gather your documents",
    description:
      "DDAP lists what to upload, including ownership and business forms, zoning and occupancy attestations, floor plans, a house manager form, an orientation handbook with house rules and fees, background checks, and written policies and procedures."
  },
  {
    title: "Create an account and apply online",
    description:
      "Set up an Initial Provider Application (IPA) account, attach every required document, and pay the application fee DDAP lists (currently $250). All documents must be attached before you submit."
  },
  {
    title: "Get ready for the on-site inspection",
    description:
      "A DDAP licensing specialist reviews your policies and walks through the home. DDAP says physical plant requirements must be addressed before the walk-through is scheduled."
  },
  {
    title: "Keep your license current",
    description:
      "Under Chapter 717, a full license expires one year after it is issued. DDAP sends renewal inspection notices by email, so add ra-saispsaalerts@pa.gov to your safe senders."
  }
];

function ExternalLink({ link }: { link: ResourceLink }) {
  return (
    <a
      className="focus-ring group flex h-full flex-col rounded-2xl border border-border bg-white p-5 transition hover:border-primary/40 hover:shadow-[0_12px_32px_rgba(23,33,43,0.08)]"
      href={link.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{link.source}</span>
      <span className="mt-2 flex items-start justify-between gap-3 text-base font-semibold leading-6 text-[#17212b]">
        {link.title}
        <ArrowUpRight aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary" size={18} />
      </span>
      <span className="mt-2 text-sm leading-6 text-muted-foreground">{link.description}</span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export default function DdapLicensingResourcesPage() {
  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="relative border-b border-border bg-[#f4f8ff]">
          <div className="pointer-events-none absolute -right-32 -top-44 size-[34rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="shell relative py-16 lg:py-24">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Resources · For recovery house operators</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl lg:text-6xl">
                Opening a recovery house in Pennsylvania?
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                A plain-language guide to recovery house licensing from the Pennsylvania Department of Drug and Alcohol Programs
                (DDAP): what it is, who needs it, the basic steps, and where to get your questions answered.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={ddapLicensingPage}>Go to DDAP licensing</ButtonLink>
                <ButtonLink href="#official-links" variant="secondary">
                  See all official links
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className="shell py-10">
          <div className="flex gap-4 rounded-2xl border border-[#f3d48a] bg-[#fff8e6] p-5 text-[#5b4300]">
            <Info aria-hidden="true" className="mt-0.5 shrink-0" size={22} />
            <p className="text-sm leading-6">
              <strong className="font-semibold">Always check DDAP for current requirements.</strong> This page is a general
              summary to help you find the right official sources. It is not legal advice, and rules, forms, and fees can
              change. Confirm everything with DDAP before you apply or make decisions about your house.
            </p>
          </div>
        </section>

        <section className="shell grid gap-10 py-10 lg:grid-cols-[0.7fr_1.3fr] lg:py-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">The basics</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">What is licensing?</h2>
          </div>
          <div className="max-w-3xl space-y-5 text-lg leading-8 text-muted-foreground">
            <p>
              DDAP runs a recovery house licensure program under Act 59 of 2017 and the regulations in 28 Pa. Code Chapter
              717. The rules cover areas like health and safety, house managers, finances, and resident rights. A licensed
              house has been reviewed and inspected by DDAP against those standards.
            </p>
            <p>
              DDAP’s FAQ explains that any house that fits the state’s definition of a drug and alcohol recovery house is
              treated as one, no matter what it calls itself, whether that is a sober home, a recovery residence, or something
              else.
            </p>
          </div>
        </section>

        <section className="border-y border-border bg-[#f4f8ff]">
          <div className="shell grid gap-10 py-16 lg:grid-cols-[0.7fr_1.3fr] lg:py-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Funding and referrals</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Who needs a license?</h2>
            </div>
            <div className="max-w-3xl space-y-5 text-lg leading-8 text-muted-foreground">
              <p>According to DDAP, a recovery house must be licensed to accept:</p>
              <ul className="space-y-3 pl-1">
                <li className="flex gap-3">
                  <Building2 aria-hidden="true" className="mt-1.5 shrink-0 text-primary" size={20} />
                  <span>Referrals from state agencies or state-funded facilities, or</span>
                </li>
                <li className="flex gap-3">
                  <Building2 aria-hidden="true" className="mt-1.5 shrink-0 text-primary" size={20} />
                  <span>Federal or state funding to deliver recovery house services.</span>
                </li>
              </ul>
              <p>
                DDAP also states that people whose treatment is paid for with state or federal funds may only be referred to
                licensed recovery houses, and that courts must give licensed houses first consideration when making residential
                recommendations for people under their supervision.
              </p>
              <p>
                In practice, that means many of the treatment programs, case managers, and county agencies that refer residents
                can only send people to licensed houses. DDAP’s FAQ covers the details, including what counts as state or
                federal funding.
              </p>
            </div>
          </div>
        </section>

        <section className="shell py-16 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Getting licensed</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">The basic steps</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-border bg-white p-6">
                <span className="grid size-9 place-items-center rounded-full bg-[#10195e] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[#17212b]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-3xl text-sm leading-6 text-muted-foreground">
            DDAP does not publish a set review timeline, because it depends on how complete the application is and whether any
            issues need to be fixed. PARR certification does not replace DDAP licensing; DDAP’s FAQ says PARR-certified houses
            are not grandfathered in.
          </p>
        </section>

        <section className="bg-[#10195e] text-white">
          <div className="shell grid gap-10 py-16 lg:grid-cols-[0.82fr_1.18fr] lg:py-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8eb8ff]">Questions?</p>
              <h2 className="mt-5 max-w-lg text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
                Where to ask for help
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-white/15 bg-white/[0.07] p-6">
                <h3 className="text-lg font-semibold">DDAP Division of Licensing Operations</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  For questions about licensing, your application, or the free Recovery House Application Workshop DDAP offers,
                  email the Bureau of Program Licensure.
                </p>
                <a className="focus-ring mt-4 inline-block font-semibold text-[#8eb8ff] underline-offset-4 hover:underline" href={`mailto:${ddapLicensingEmail}`}>
                  {ddapLicensingEmail}
                </a>
              </article>
              <article className="rounded-2xl border border-white/15 bg-white/[0.07] p-6">
                <h3 className="text-lg font-semibold">PARR</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  PARR offers voluntary certification to the NARR Standard and says it helps certified houses prepare for state
                  licensing. It is not a licensing authority.
                </p>
                <a
                  className="focus-ring mt-4 inline-block font-semibold text-[#8eb8ff] underline-offset-4 hover:underline"
                  href="https://www.parronline.org/application-process"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  parronline.org
                </a>
              </article>
            </div>
          </div>
        </section>

        <section className="shell scroll-mt-24 py-16 lg:py-20" id="official-links">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Official sources</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Licensing resources</h2>
          <div className="mt-10 space-y-10">
            {officialLinks.map(({ heading, icon: Icon, links }) => (
              <div key={heading}>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[#17212b]">
                  <Icon aria-hidden="true" className="text-primary" size={20} />
                  {heading}
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {links.map((link) => (
                    <ExternalLink key={link.href} link={link} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-[#f4f8ff]">
          <div className="shell py-16 text-center sm:py-20">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">Get your house in front of referrers</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Aftercare Compass helps social workers, case managers, and discharge planners find recovery housing with real-time
              availability. Claim or create your profile and keep it up to date as you work toward licensing.
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
