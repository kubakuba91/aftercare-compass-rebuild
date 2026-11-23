import { ddapFundingOpportunities } from "./funding";
import type { ResourceLink, StateResource } from "./types";

// All links below were checked live on 2026-11-16. Re-check before adding or changing a state.

const narr = (slug: string, name: string): ResourceLink => ({
  title: name,
  href: `https://narronline.org/affiliate/${slug}/`,
  source: "narronline.org · NARR state affiliate"
});

const ddapFaq = "DDAP Recovery House Licensure FAQs";
const ch717 = "28 Pa. Code Chapter 717";

const unsortedStateResources: StateResource[] = [
  {
    code: "PA",
    name: "Pennsylvania",
    oversight: "required-license",
    oversightLabel: "State license (DDAP) required for state-funded referrals and public funding",
    body: {
      name: "Pennsylvania Department of Drug and Alcohol Programs (DDAP), Bureau of Program Licensure",
      href: "https://www.pa.gov/services/ddap/apply-to-become-a-licensed-recovery-house"
    },
    summary: [
      {
        text: "DDAP licenses drug and alcohol recovery houses under Act 59 of 2017 and the regulations in 28 Pa. Code Chapter 717, which cover areas like health and safety, house managers, finances, and resident rights.",
        source: "DDAP — Apply to Become a Licensed Recovery House"
      },
      {
        text: "A recovery house must be licensed to accept referrals from state agencies or state-funded facilities, or federal or state funding to deliver recovery house services. People whose treatment is paid for with state or federal funds may only be referred to licensed houses, and courts give licensed houses first consideration.",
        source: "DDAP — Apply to Become a Licensed Recovery House"
      },
      {
        text: "Any house that fits the state’s definition of a drug and alcohol recovery house is treated as one, no matter what it calls itself.",
        source: ddapFaq
      }
    ],
    steps: [
      "Read DDAP’s licensing page and 28 Pa. Code Chapter 717.",
      "Gather the documents DDAP lists: ownership and business forms, zoning and occupancy attestations, floor plans, a house manager form, an orientation handbook with house rules and fees, background checks, and written policies and procedures.",
      "Create an Initial Provider Application (IPA) account, attach every required document, and pay the application fee DDAP lists (currently $250).",
      "Get ready for the on-site inspection. DDAP says physical plant requirements must be addressed before the walk-through is scheduled.",
      "Renew every year. Under Chapter 717, a full license expires one year after it is issued."
    ],
    links: [
      {
        title: "Apply to Become a Licensed Recovery House",
        href: "https://www.pa.gov/services/ddap/apply-to-become-a-licensed-recovery-house",
        source: "pa.gov · DDAP",
        description: "Who needs a license, required documents, account setup, and contacts."
      },
      {
        title: "New Recovery House Licensing Workshop",
        href: "https://tms.ddap.pa.gov/about/course-catalog/",
        source: "tms.ddap.pa.gov · DDAP Training Management System",
        description:
          "Free 4-hour workshop for people applying for a recovery house license. On the public catalog it is listed under Administrative. In TMS (tms.ddap.pa.gov), open Find Training, then Course Catalog, then Administrative. Questions: Bureau of Program Licensure, 717-783-8675."
      },
      {
        title: "TMS cancellation and $50 no-show policy",
        href: "https://tms.ddap.pa.gov/about/tms-faqs-and-help/",
        source: "tms.ddap.pa.gov · DDAP",
        description:
          "The licensing workshop is free. If you miss a TMS training without canceling, DDAP assigns a $50 no-show fee and you cannot register for more classes until it is paid. Cancel in My Course Dashboard up to 2 hours after the posted start time."
      },
      {
        title: "DDAP correspondence signup",
        href: "https://pa-ddap.info/existing-subscriber-signup-email",
        source: "pa-ddap.info · DDAP",
        description:
          "Sign up for DDAP email and text updates on licensing and policy, funding, training, webinars, and technical assistance. Choose at least one list, then confirm the email from ra-daddap-emails@pa.gov. To stop messages, use the link in an email, reply STOP to a text, call 717-783-8200, or email ra-daddap-emails@pa.gov."
      },
      {
        title: "Initial Provider Application (IPA) login",
        href: "https://sais.health.pa.gov/commonpoc/Licensing/IPA/Login.aspx",
        source: "sais.health.pa.gov · DDAP",
        description: "Where you create an account and submit your application."
      },
      {
        title: "How to apply for recovery house licensure (PDF)",
        href: "https://www.pa.gov/content/dam/copapwp-pagov/en/ddap/documents/licensing/documents/recovery-house-licensing/how%20to%20apply%20for%20recovery%20house%20licensure.pdf",
        source: "pa.gov · DDAP"
      },
      {
        title: "Recovery house floor plan checklist (PDF)",
        href: "https://www.pa.gov/content/dam/copapwp-pagov/en/ddap/documents/licensing/documents/recovery-house-licensing/recovery%20house%20floor%20plan%20checklist.pdf",
        source: "pa.gov · DDAP"
      },
      {
        title: "Act 59 of 2017 (recovery house law)",
        href: "https://www.palegis.us/statutes/unconsolidated/law-information?actNum=59&sessInd=0&sessYr=2017",
        source: "palegis.us · PA General Assembly"
      },
      {
        title: "28 Pa. Code Chapter 717 — Standards for Drug and Alcohol Recovery House Licensure",
        href: "https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/028/chapter717/chap717toc.html",
        source: "pacodeandbulletin.gov"
      },
      {
        title: "Recovery House Licensure FAQs (PDF)",
        href: "https://www.pa.gov/content/dam/copapwp-pagov/en/ddap/documents/licensing/documents/recovery-house-licensing/recovery%20house%20faq.pdf",
        source: "pa.gov · DDAP"
      },
      {
        title: "DDAP zoning requirements attestation (PDF)",
        href: "https://www.pa.gov/content/dam/copapwp-pagov/en/ddap/documents/licensing/documents/recovery-house-licensing/zoning%20requirements.pdf",
        source: "pa.gov · DDAP",
        description: "Proof of zoning isn’t required under Chapter 717, but you attest you’ll follow applicable local laws."
      },
      {
        title: "DDAP occupancy requirements attestation (PDF)",
        href: "https://www.pa.gov/content/dam/copapwp-pagov/en/ddap/documents/licensing/documents/recovery-house-licensing/occupancy%20requirements.pdf",
        source: "pa.gov · DDAP",
        description: "A certificate of occupancy isn’t required under Chapter 717, but you attest you’ll follow applicable local laws."
      },
      {
        title: "Pennsylvania Uniform Construction Code (UCC)",
        href: "https://www.pa.gov/agencies/dli/programs-services/labor-management-relations/bureau-of-occupational-and-industrial-safety/uniform-construction-code-home",
        source: "pa.gov · Department of Labor & Industry",
        description: "Pennsylvania’s statewide building code and who enforces it."
      },
      {
        title: "UCC status and code official contacts by municipality",
        href: "https://www.pa.gov/content/dam/copapwp-pagov/en/dli/documents/individuals/labor-management-relations/bois/documents/uccmun.htm",
        source: "pa.gov · Department of Labor & Industry",
        description: "Look up whether your municipality enforces the UCC and who to call."
      },
      {
        title: "DDAP Drug and Alcohol Facility Locator",
        href: "https://sais.health.pa.gov/commonpoc/Content/PublicWeb/DAFind.aspx",
        source: "sais.health.pa.gov · DDAP",
        description: "Search licensed recovery houses by county, distance, type, or name."
      }
    ],
    local: {
      label: "Single County Authorities (SCAs)",
      description:
        "Local treatment programs are administered through county drug and alcohol offices called Single County Authorities. They can help with treatment funding, assess the need for services, and make referrals. DDAP’s FAQ notes that SCAs receive weekly licensing-status reports from DDAP and, since January 1, 2023, may only fund licensed recovery houses. In Lancaster County, the SCA is the Lancaster County Drug and Alcohol Commission (150 N. Queen St., Lancaster; 717-299-8023).",
      links: [
        {
          title: "DDAP County Drug and Alcohol Offices (SCA directory)",
          href: "https://www.pa.gov/agencies/ddap/treatment-and-support/county-drug-and-alcohol-offices",
          source: "pa.gov · DDAP"
        },
        {
          title: "Lancaster County Drug & Alcohol Commission (Lancaster SCA)",
          href: "https://www.lancastercountypa.gov/140/Drug-Alcohol-Commission",
          source: "lancastercountypa.gov"
        },
        {
          title: "Lancaster County Planning Department",
          href: "https://lancastercountyplanning.org/",
          source: "lancastercountyplanning.org",
          description: "Zoning is set by each of Lancaster County’s 60 municipalities; the county reviews local ordinances."
        }
      ]
    },
    narrAffiliate: {
      title: "Pennsylvania Alliance of Recovery Residences (PARR)",
      href: "https://www.parronline.org/application-process",
      source: "parronline.org · PARR",
      description: "Voluntary certification to the NARR Standard. PARR is not a licensing authority, and DDAP says PARR-certified houses are not grandfathered into licensure."
    },
    funding: [
      {
        text: "Only licensed recovery houses can receive federal or state funding to deliver recovery house services. DDAP’s FAQ says federal or state funding may include Medicare and Medicaid, SCA treatment funding for un- or underinsured clients, and state agency grants.",
        source: ddapFaq
      },
      {
        text: "DDAP posts current grant announcements on its Funding Opportunities page. Questions about DDAP funding and grants go to RA-DAGRANTSMGMT@pa.gov; questions about funding under the regulations go to RA-DAAPI_DIVISION@pa.gov. Other funding questions may be better suited for your SCA.",
        source: ddapFaq
      },
      {
        text: "Lancaster County example: the Lancaster SCA runs a Recovery House Scholarship program, funded by the Lancaster opioid settlement grant, that pays rent at DDAP-licensed recovery houses located in Lancaster County and contracted with the Lancaster SCA. Eligible residents must be in recovery from opioid use disorder and meet other criteria. Houses apply with Form SF7 after they are licensed.",
        source: "Lancaster County Drug & Alcohol Commission — Recovery House Scholarships"
      }
    ],
    fundingLinks: [
      ddapFundingOpportunities,
      {
        title: "Lancaster SCA Recovery House Scholarships",
        href: "https://www.lancastercountypa.gov/2953/Recovery-House-Scholarships",
        source: "lancastercountypa.gov"
      }
    ],
    faq: [
      {
        question: "Can I open before I’m licensed?",
        answer:
          "DDAP requires a license to accept referrals from state agencies or state-funded facilities, or federal or state funding. DDAP’s FAQ says a person may choose on their own to live in an unlicensed house as long as the house doesn’t receive federal, state, or county funds, and that DDAP can fine unlicensed houses that receive public funds.",
        source: `${ddapFaq}; DDAP licensing page`
      },
      {
        question: "Do I need a house manager?",
        answer:
          "Yes. Chapter 717 requires you to designate a house manager responsible for managing the house, staff, and volunteers, name them in your application, tell DDAP within 30 days if they change, and have them complete at least 6 hours of training within 6 months and every year after.",
        source: `${ch717} § 717.15`
      },
      {
        question: "What do staff and volunteers need?",
        answer:
          "Chapter 717 requires a Pennsylvania State Police criminal history check before they start, and CPR certification, first aid training, HIV/AIDS, TB, and STD training, and fire prevention training within 90 days.",
        source: `${ch717} §§ 717.17–717.18`
      },
      {
        question: "How long does licensing take?",
        answer:
          "DDAP doesn’t give a timeframe. It depends on whether the application is complete, meets the regulations, and whether physical plant issues need to be fixed.",
        source: ddapFaq
      },
      {
        question: "Can I submit some documents after I apply?",
        answer: "No. All required documentation must be attached before you submit. You can save your online application as many times as you need before then.",
        source: ddapFaq
      },
      {
        question: "Do I have to accept residents on medication for opioid use disorder (MOUD) or medical marijuana?",
        answer:
          "DDAP’s FAQ says yes. Residents may attend the treatment facility of their choice, including MOUD providers, and medical marijuana used under the state program isn’t an “illicit drug” under the regulations. Controlled substances must be stored in a locked container.",
        source: `${ddapFaq}; ${ch717} §§ 717.19, 717.24`
      },
      {
        question: "Can referrals come from another county?",
        answer: "Yes. DDAP says neither Act 59 nor Chapter 717 distinguishes by the county where a recovery house is located.",
        source: ddapFaq
      },
      {
        question: "How long does a license last?",
        answer: "A full license expires one year after it is issued and must be displayed in a public, conspicuous place in the house.",
        source: `${ch717} § 717.7`
      }
    ]
  },
  {
    code: "NJ",
    name: "New Jersey",
    oversight: "required-license",
    oversightLabel: "Class F cooperative sober living residence license (DCA)",
    body: {
      name: "New Jersey Department of Community Affairs (DCA), Bureau of Rooming and Boarding House Standards",
      href: "https://www.nj.gov/dca/codes/offices/roomingboarding.shtml"
    },
    summary: [
      {
        text: "DCA’s Bureau of Rooming and Boarding House Standards licenses rooming and boarding houses and runs yearly physical and social evaluations before renewal.",
        source: "NJ DCA — Bureau of Rooming and Boarding House Standards"
      },
      {
        text: "Under N.J.A.C. 5:27-1.6, a Class F license is valid only for cooperative sober living residences, and no one may own or operate a rooming or boarding house without a license from the Bureau.",
        source: "N.J.A.C. 5:27-1.6"
      }
    ],
    links: [
      {
        title: "Bureau of Rooming and Boarding House Standards (applications, fees, contact)",
        href: "https://www.nj.gov/dca/codes/offices/roomingboarding.shtml",
        source: "nj.gov · DCA"
      },
      {
        title: "N.J.A.C. 5:27-1.6 — Licenses (license classes and fees)",
        href: "https://www.law.cornell.edu/regulations/new-jersey/N-J-A-C-5-27-1-6",
        source: "law.cornell.edu · Legal Information Institute"
      }
    ],
    local: {
      label: "County Alcohol and Drug Use Directors",
      description: "Each county has an alcohol and drug use director listed by the NJ Division of Mental Health and Addiction Services.",
      links: [
        {
          title: "County Alcohol and Drug Use Directors & County Mental Health Administrators",
          href: "https://www.nj.gov/humanservices/dmhas/about/boards/admin/",
          source: "nj.gov · DMHAS"
        }
      ]
    },
    gaps: ["No NARR state affiliate listed for New Jersey on narronline.org.", "Step-by-step Class F process and funding sources not verified on an official page."]
  },
  {
    code: "NY",
    name: "New York",
    oversight: "voluntary-certification",
    oversightLabel: "Voluntary state certification (OASAS)",
    body: { name: "NYS Office of Addiction Services and Supports (OASAS)", href: "https://oasas.ny.gov/certified-recovery-residences" },
    summary: [
      {
        text: "OASAS certifies recovery residences under 14 NYCRR Part 860. Certification is voluntary and not required to provide recovery housing, but only certified residences may call themselves a “Certified Recovery Residence” and be listed by OASAS.",
        source: "OASAS — 14 NYCRR Part 860"
      },
      {
        text: "Initial certification lasts up to one year and can be renewed. Applications go to both the OASAS Bureau of Certification and the regional office for your area, and OASAS may visit before certifying.",
        source: "OASAS — 14 NYCRR Part 860"
      }
    ],
    links: [
      { title: "OASAS Certified Recovery Residences", href: "https://oasas.ny.gov/certified-recovery-residences", source: "oasas.ny.gov" },
      { title: "14 NYCRR Part 860 — Recovery Residences", href: "https://oasas.ny.gov/recovery-residences-part-860", source: "oasas.ny.gov" }
    ],
    narrAffiliate: { ...narr("new-york-state-alliance-of-recovery-residences", "New York State Alliance of Recovery Residences (NYSARR)") },
    gaps: ["County or local government unit contacts not verified.", "State recovery housing funding not verified."]
  },
  {
    code: "DE",
    name: "Delaware",
    oversight: "voluntary-certification-with-funding-or-referral-limits",
    oversightLabel: "Voluntary certification; required for state or local funding",
    body: { name: "Division of Substance Abuse and Mental Health (DSAMH), through its certifying organization", href: "https://delcode.delaware.gov/title16/c022a/index.html" },
    summary: [
      {
        text: "Title 16, Chapter 22A directs DSAMH to contract with a certifying organization to run a voluntary certification program for recovery houses and a training program for operators.",
        source: "Del. Code tit. 16, ch. 22A"
      },
      {
        text: "Except for certified recovery houses, Oxford Houses, or houses authorized by the Division, it is unlawful for a recovery house to accept state or local funding. Advertising a house as certified when it isn’t is also unlawful.",
        source: "Del. Code tit. 16, §§ 2213A–2214A"
      },
      {
        text: "The First State Alliance of Recovery Residences (FSARR) issued Delaware’s first certifications under the law in 2024 and was reported as the only certifying entity at that time.",
        source: "Delaware Public Media, May 20, 2024"
      }
    ],
    links: [
      { title: "Delaware Code Title 16, Chapter 22A — Recovery Housing", href: "https://delcode.delaware.gov/title16/c022a/index.html", source: "delcode.delaware.gov" },
      { title: "FSARR certification", href: "https://fsarr.org/certification/", source: "fsarr.org" },
      {
        title: "First 13 recovery residences receive certification under new codified standards",
        href: "https://www.delawarepublic.org/politics-government/2024-05-20/first-13-recovery-residences-receive-certification-under-new-codified-standards",
        source: "delawarepublic.org · Delaware Public Media"
      }
    ],
    narrAffiliate: narr("first-state-alliance-of-recovery-residences", "First State Alliance of Recovery Residences (FSARR)"),
    funding: [{ text: "Chapter 22A creates a Certified Recovery House Fund to support the program.", source: "Del. Code tit. 16, § 2216A" }],
    gaps: ["Local or county equivalents not verified."]
  },
  {
    code: "MD",
    name: "Maryland",
    oversight: "required-certification",
    oversightLabel: "State certification (MCORR) required for state funding or the “certified” label",
    body: {
      name: "Maryland Department of Health, Behavioral Health Administration — Maryland Certification of Recovery Residences (MCORR)",
      href: "https://health.maryland.gov/bha/Pages/Maryland-Certification-of-Recovery-Residence-License-.aspx"
    },
    summary: [
      {
        text: "Under COMAR 10.63.08.03, a recovery residence must be certified by the Department’s designated credentialing entity to operate in Maryland if it receives state funds or operates, advertises, or represents itself as a certified recovery residence. Chartered Oxford Houses are exempt. Each residence needs its own certificate.",
        source: "COMAR 10.63.08"
      },
      {
        text: "The Behavioral Health Administration is the designated credentialing entity through MCORR, and a certificate of compliance is valid for one year.",
        source: "MDH letter on SB 876 (2026); Md. Health-Gen. § 19-2502"
      }
    ],
    links: [
      { title: "Maryland Certification of Recovery Residences (MCORR)", href: "https://health.maryland.gov/bha/Pages/Maryland-Certification-of-Recovery-Residence-License-.aspx", source: "health.maryland.gov · BHA" },
      { title: "COMAR 10.63.08 — Recovery Residence Certification", href: "https://health.maryland.gov/regs/Pages/10-63-08-Recovery-Residence-Certification-(---.aspx", source: "health.maryland.gov" },
      { title: "Health-General § 19-2502", href: "https://mgaleg.maryland.gov/2026RS/Statute_Web/ghg/19-2502.pdf", source: "mgaleg.maryland.gov" }
    ],
    local: {
      label: "Local Behavioral Health Authorities",
      description: "Maryland’s Behavioral Health Administration lists each jurisdiction’s local behavioral health authority.",
      links: [{ title: "BHA Local Jurisdictions", href: "https://health.maryland.gov/bha/Pages/local-jurisdiction.aspx", source: "health.maryland.gov · BHA" }]
    },
    funding: [
      {
        text: "BHA oversees Maryland RecoveryNet (MDRN), which partners with service providers to fund access to recovery support services for people seeking substance use disorder treatment.",
        source: "MDH letter on SB 876 (2026)"
      }
    ],
    fundingLinks: [
      { title: "MDH letter of information on SB 876 (2026)", href: "https://mgaleg.maryland.gov/cmte_testimony/2026/hlt/1qQuHKqqLPY2lF6ncSOsihPk4zSyIyX_4.pdf", source: "mgaleg.maryland.gov" }
    ],
    gaps: ["No NARR state affiliate listed for Maryland on narronline.org (MCORR certifies in accordance with NARR)."]
  },
  {
    code: "VA",
    name: "Virginia",
    oversight: "required-certification",
    oversightLabel: "State certification (DBHDS) required to operate",
    body: { name: "Virginia Department of Behavioral Health and Developmental Services (DBHDS)", href: "https://dbhds.virginia.gov/information-for-providers-about-recovery-residences/" },
    summary: [
      {
        text: "Va. Code § 37.2-431.1 says no person may operate a recovery residence, or represent one as certified, unless DBHDS has certified it. Violation is a Class 1 misdemeanor.",
        source: "Va. Code § 37.2-431.1"
      },
      {
        text: "DBHDS may issue a conditional certification for up to six months, renewable once for up to three months, to a residence working toward accreditation. DBHDS says applicants must have at least submitted policies and procedures to a certifying body.",
        source: "Va. Code § 37.2-431.1; DBHDS"
      },
      {
        text: "DBHDS recognizes two accrediting entities: Oxford House and the Virginia Association of Recovery Residences (VARR). Every residence must tell prospective residents its credentialing entity and, for NARR-based homes, its level of support.",
        source: "DBHDS; Va. Code § 37.2-431.1"
      }
    ],
    links: [
      { title: "DBHDS — Information for Providers About Recovery Residences", href: "https://dbhds.virginia.gov/information-for-providers-about-recovery-residences/", source: "dbhds.virginia.gov" },
      { title: "Va. Code § 37.2-431.1 — Recovery residences", href: "https://law.lis.virginia.gov/vacode/title37.2/chapter4/section37.2-431.1/", source: "law.lis.virginia.gov" },
      { title: "Virginia Association of Recovery Residences (VARR)", href: "https://varronline.org/", source: "varronline.org" }
    ],
    local: {
      label: "Community Services Boards (CSBs)",
      description: "DBHDS works with local Community Services Boards across Virginia.",
      links: [{ title: "DBHDS Community Services Boards", href: "https://dbhds.virginia.gov/community-services-boards-csbs/", source: "dbhds.virginia.gov" }]
    },
    narrAffiliate: narr("virginia-association-of-recovery-residences", "Virginia Association of Recovery Residences (VARR)"),
    gaps: ["Recovery housing funding details not verified (DBHDS page references indigent bed funding without details)."]
  },
  {
    code: "WV",
    name: "West Virginia",
    oversight: "registration-plus-voluntary-certification",
    oversightLabel: "Registration required; certification voluntary but needed for state referrals and funds",
    body: { name: "WV Office of Inspector General — Office of Health Facility Licensure and Certification (OHFLAC)", href: "https://oig.wv.gov/frequently-asked-questions-faq" },
    summary: [
      { text: "All recovery residences operating in West Virginia must be registered with OHFLAC. Certification is voluntary and separate from registration.", source: "WV OIG FAQ" },
      { text: "The West Virginia Alliance of Recovery Residences (WVARR) is the certifying agency.", source: "WV OIG FAQ" },
      {
        text: "Under W. Va. Code § 16-59-3, corrections, parole, probation, day report centers, municipal courts, and state-funded medical or clinical facilities may not refer people to a recovery residence without a valid certificate of compliance, and uncertified residences can’t receive funds from the State Treasury.",
        source: "W. Va. Code § 16-59-3"
      }
    ],
    links: [
      { title: "WV OIG FAQ — recovery residence registration and certification", href: "https://oig.wv.gov/frequently-asked-questions-faq", source: "oig.wv.gov" },
      { title: "W. Va. Code § 16-59-3 — Referrals and state funds", href: "https://code.wvlegislature.gov/16-59-3/", source: "code.wvlegislature.gov" },
      { title: "WVARR certification", href: "https://wvarr.org/certification/", source: "wvarr.org" }
    ],
    narrAffiliate: narr("west-virginia-alliance-of-recovery-residences", "West Virginia Alliance of Recovery Residences (WVARR)"),
    gaps: ["Local or county equivalents not verified.", "State funding programs not verified."]
  },
  {
    code: "NC",
    name: "North Carolina",
    oversight: "not-verified",
    oversightLabel: "State requirements not verified — start with NCARR",
    body: { name: "North Carolina Association of Recovery Residences (NCARR)", href: "https://ncarr.org/" },
    summary: [
      {
        text: "We couldn’t confirm a state recovery residence license or certification program on an official North Carolina source. NCARR, the NARR affiliate, offers certification to NARR standards. Check with NC DHHS and your local LME/MCO before you open.",
        source: "NCARR; NARR affiliates"
      }
    ],
    links: [{ title: "NCARR FAQs", href: "https://ncarr.org/faqs/", source: "ncarr.org" }],
    local: {
      label: "LME/MCOs",
      description: "Local Management Entity/Managed Care Organizations manage public behavioral health services by county.",
      links: [{ title: "NC DHHS LME/MCO Directory", href: "https://www.ncdhhs.gov/providers/lme-mco-directory", source: "ncdhhs.gov" }]
    },
    narrAffiliate: narr("north-carolina-association-of-recovery-residences", "North Carolina Association of Recovery Residences (NCARR)"),
    gaps: ["No official NC source found confirming whether recovery residences need a state license or certification."]
  },
  {
    code: "CT",
    name: "Connecticut",
    oversight: "voluntary-certification",
    oversightLabel: "Voluntary certification; DMHAS lists certified sober living homes",
    body: { name: "Department of Mental Health and Addiction Services (DMHAS)", href: "https://portal.ct.gov/dmhas/divisions/behavioral-health-division/certified-sober-living-homes" },
    summary: [
      {
        text: "DMHAS lists Connecticut certified sober living homes as required by Public Act 18-171, but says it does not monitor, certify, or oversee sober living homes.",
        source: "DMHAS — Certified Sober Living Homes"
      },
      {
        text: "Certified sober living homes are certified by a NARR affiliate or another organization DMHAS recognizes. DMHAS lists the Connecticut Alliance of Recovery Residences (CTARR) as the NARR local affiliate.",
        source: "DMHAS — Certified Sober Living Homes"
      }
    ],
    links: [
      { title: "DMHAS — Certified Sober Living Homes", href: "https://portal.ct.gov/dmhas/divisions/behavioral-health-division/certified-sober-living-homes", source: "portal.ct.gov · DMHAS" },
      { title: "Connecticut Alliance of Recovery Residences (CTARR)", href: "https://ctrecoveryresidences.org/", source: "ctrecoveryresidences.org" }
    ],
    narrAffiliate: narr("connecticut-alliance-of-recovery-residences", "Connecticut Alliance of Recovery Residences (CTARR)"),
    gaps: ["Referral rules for certified homes not verified on an official page.", "Local equivalents and funding not verified."]
  },
  {
    code: "MA",
    name: "Massachusetts",
    oversight: "voluntary-certification-with-funding-or-referral-limits",
    oversightLabel: "Voluntary certification; state agencies may only refer to certified homes",
    body: { name: "Department of Public Health, Bureau of Substance Addiction Services (BSAS)", href: "https://malegislature.gov/Laws/GeneralLaws/PartI/TitleII/Chapter17/Section18A" },
    summary: [
      { text: "M.G.L. c. 17, § 18A directs BSAS to run a voluntary training and accreditation program for operators of alcohol and drug free housing (sober homes).", source: "M.G.L. c. 17, § 18A" },
      {
        text: "State agencies, vendors with statewide contracts, and officials setting release, parole, or discharge terms may not refer people to sober homes that aren’t certified. Uncertified homes may still operate and advertise as alcohol and drug free housing.",
        source: "M.G.L. c. 17, § 18A(h)"
      }
    ],
    links: [
      { title: "M.G.L. c. 17, § 18A", href: "https://malegislature.gov/Laws/GeneralLaws/PartI/TitleII/Chapter17/Section18A", source: "malegislature.gov" },
      { title: "MASH — Massachusetts sober homes law", href: "https://mashsoberhousing.org/certification/ma-sober-homes-law/", source: "mashsoberhousing.org" }
    ],
    narrAffiliate: narr("massachusetts-alliance-for-sober-housing", "Massachusetts Alliance for Sober Housing (MASH)"),
    gaps: ["Local equivalents and funding not verified."]
  },
  {
    code: "OH",
    name: "Ohio",
    oversight: "voluntary-certification-with-funding-or-referral-limits",
    oversightLabel: "State registry of accredited homes; providers may only refer to listed homes",
    body: { name: "Ohio Department of Behavioral Health (DBH)", href: "https://dbh.ohio.gov/supporting-providers/housing-providers/recovery-housing-residences/statewide-registry" },
    summary: [
      {
        text: "DBH keeps a registry of recovery housing residences that are accredited, or newer residences (18 months or less) actively working toward accreditation (R.C. 5119.394).",
        source: "Ohio DBH — Statewide Registry"
      },
      {
        text: "Since January 1, 2025, community addiction and mental health services providers may not refer clients to a residence that isn’t on the registry (R.C. 5119.396).",
        source: "Ohio DBH — Statewide Registry"
      },
      { text: "DBH recognizes Ohio Recovery Housing accreditation and Oxford House charters.", source: "Ohio DBH — Statewide Registry" }
    ],
    links: [
      { title: "DBH Recovery Housing Statewide Registry", href: "https://dbh.ohio.gov/supporting-providers/housing-providers/recovery-housing-residences/statewide-registry", source: "dbh.ohio.gov" },
      { title: "Recovery housing registry search", href: "https://rhsearch.dbh.ohio.gov/", source: "rhsearch.dbh.ohio.gov" },
      { title: "Ohio Revised Code § 340.034 — Recovery housing", href: "https://codes.ohio.gov/ohio-revised-code/section-340.034", source: "codes.ohio.gov" },
      { title: "Ohio Recovery Housing", href: "https://www.ohiorecoveryhousing.org/", source: "ohiorecoveryhousing.org" }
    ],
    local: {
      label: "ADAMH boards",
      description: "County Alcohol, Drug Addiction and Mental Health (ADAMH) boards plan and fund local services.",
      links: [{ title: "OACBHA — ADAMH board directory", href: "https://www.oacbha.org/adamh_boards.php", source: "oacbha.org" }]
    },
    narrAffiliate: narr("ohio-recovery-housing", "Ohio Recovery Housing (ORH)"),
    gaps: ["State recovery housing funding not verified."]
  },
  {
    code: "TN",
    name: "Tennessee",
    oversight: "voluntary-certification",
    oversightLabel: "State-approved certification organizations (TDMHSAS)",
    body: { name: "Tennessee Department of Mental Health and Substance Abuse Services (TDMHSAS)", href: "https://www.tn.gov/behavioral-health/substance-abuse-services/treatment/recovery-residences.html" },
    summary: [
      {
        text: "Starting January 1, 2026, TDMHSAS selects and approves Recovery Residence Certification Organizations under Tenn. Code Ann. § 33-2-1401 (Public Chapter 406). Approved organizations must meet the minimum standards in § 33-2-1404.",
        source: "TDMHSAS — Recovery Residences"
      },
      {
        text: "TDMHSAS lists the Tennessee Alliance of Recovery Residences (TN-ARR) and Recovery is the New High (RITNH) as approved certification organizations.",
        source: "TDMHSAS — Recovery Residences"
      }
    ],
    links: [
      { title: "TDMHSAS — Recovery Residences", href: "https://www.tn.gov/behavioral-health/substance-abuse-services/treatment/recovery-residences.html", source: "tn.gov" },
      { title: "Tennessee Alliance of Recovery Residences (TN-ARR)", href: "https://tnarr.org/", source: "tnarr.org" }
    ],
    narrAffiliate: narr("tennessee-alliance-of-recovery-residences", "Tennessee Alliance of Recovery Residences (TN-ARR)"),
    gaps: ["Whether certification is required to operate or to receive referrals was not confirmed on an official page.", "Local equivalents and funding not verified."]
  },
  {
    code: "GA",
    name: "Georgia",
    oversight: "no-state-license",
    oversightLabel: "No state license — voluntary certification through GARR",
    body: { name: "Georgia Association of Recovery Residences (GARR)", href: "https://narronline.org/affiliate/georgia-association-of-recovery-residences/" },
    summary: [
      { text: "The Georgia Attorney General’s Consumer Protection Division says recovery residences are not licensed in Georgia.", source: "Georgia AG Consumer Protection Division" },
      {
        text: "The state’s Transitional Housing for Offender Reentry (THOR) directory lists recovery residences accredited by GARR, the Department of Community Health, CARF, or the Joint Commission.",
        source: "Georgia AG Consumer Protection Division"
      }
    ],
    links: [
      { title: "Recovery Residences (Halfway Houses)", href: "https://consumer.georgia.gov/recovery-residences-halfway-houses-0", source: "consumer.georgia.gov · Georgia AG" }
    ],
    narrAffiliate: narr("georgia-association-of-recovery-residences", "Georgia Association of Recovery Residences (GARR)"),
    gaps: ["GARR's own website (garronline.org) was down when checked (HTTP 522), so it isn't linked.", "Local equivalents and funding not verified."]
  },
  {
    code: "SC",
    name: "South Carolina",
    oversight: "voluntary-certification",
    oversightLabel: "Voluntary state certification program run by SCARR",
    body: { name: "SC Department of Behavioral Health and Developmental Disabilities (BHDD), Office of Substance Use Services", href: "https://bhdd.sc.gov/office-substance-use-services/services/recovery" },
    summary: [
      {
        text: "As directed by Act 160 of 2024, the BHDD Office of Substance Use Services approved the South Carolina Alliance for Recovery Residences (SCARR) to develop and administer a voluntary certification program for recovery house operators.",
        source: "SC BHDD — Recovery"
      }
    ],
    links: [
      { title: "BHDD Office of Substance Use Services — Recovery", href: "https://bhdd.sc.gov/office-substance-use-services/services/recovery", source: "bhdd.sc.gov" },
      { title: "SCARR certified residence application process", href: "https://scarronline.org/certified-residence-application-process/", source: "scarronline.org" }
    ],
    local: {
      label: "County alcohol and drug abuse authorities",
      description: "BHDD’s Office of Substance Use Services works with contracted county providers.",
      links: [{ title: "BHDD OSUS providers", href: "https://bhdd.sc.gov/office-substance-use-services/providers", source: "bhdd.sc.gov" }]
    },
    narrAffiliate: narr("south-carolina-alliance-for-recovery-residences", "South Carolina Alliance for Recovery Residences (SCARR)"),
    gaps: ["Referral or funding requirements tied to SCARR certification not confirmed on an official page."]
  },
  {
    code: "FL",
    name: "Florida",
    oversight: "voluntary-certification-with-funding-or-referral-limits",
    oversightLabel: "Voluntary certification; licensed providers may only refer to certified homes",
    body: { name: "Florida Department of Children and Families (DCF), through approved credentialing entities", href: "https://www.myflfamilies.com/services/samh/recovery-residence-administrators-and-recovery-residences" },
    summary: [
      {
        text: "Fla. Stat. § 397.487 sets up a voluntary certification program for recovery residences, run by a DCF-approved credentialing entity. DCF lists the Florida Association of Recovery Residences (FARR) for recovery residences and the Florida Certification Board for recovery residence administrators.",
        source: "Florida DCF; Fla. Stat. § 397.487"
      },
      {
        text: "Under Fla. Stat. § 397.4873, licensed service providers generally may not refer patients to, or accept referrals from, a recovery residence unless it holds a valid certificate of compliance and is actively managed by a certified recovery residence administrator. The statute lists exceptions.",
        source: "Fla. Stat. § 397.4873"
      }
    ],
    links: [
      { title: "DCF — Recovery Residence Administrators and Recovery Residences", href: "https://www.myflfamilies.com/services/samh/recovery-residence-administrators-and-recovery-residences", source: "myflfamilies.com · DCF" },
      { title: "Fla. Stat. § 397.487 — Voluntary certification", href: "https://www.flsenate.gov/Laws/Statutes/2025/397.487", source: "flsenate.gov" },
      { title: "Fla. Stat. § 397.4873 — Referrals", href: "https://www.flsenate.gov/Laws/Statutes/2025/397.4873", source: "flsenate.gov" },
      { title: "FARR — Get Certified", href: "https://www.farronline.org/certification", source: "farronline.org" }
    ],
    local: {
      label: "Managing Entities",
      description: "DCF contracts with regional Managing Entities for substance abuse and mental health services.",
      links: [{ title: "DCF Managing Entities", href: "https://www.myflfamilies.com/services/samh/providers/managing-entities", source: "myflfamilies.com · DCF" }]
    },
    narrAffiliate: narr("florida-association-of-recovery-residences", "Florida Association of Recovery Residences (FARR)"),
    gaps: ["State recovery housing funding not verified."]
  }
];

export const stateResources: StateResource[] = [...unsortedStateResources].sort((a, b) => a.name.localeCompare(b.name));

export function findStateResource(code?: string | null) {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return stateResources.find((state) => state.code === upper);
}
