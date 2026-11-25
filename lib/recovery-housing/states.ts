import { ddapFundingOpportunities, delawareDsamhFunding, marylandGrantsOffice, newJerseyDhsProposals } from "./funding";
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
        source: "lancastercountypa.gov",
        description: "Lancaster County scholarships that pay for a recovery house stay, with application forms for houses and referring agencies."
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
        text: "DCA’s Bureau of Rooming and Boarding House Standards licenses rooming and boarding houses. It evaluates physical safety and social well-being every year before renewal. Owners and operators apply to the Bureau. Social evaluations are done by the Bureau.",
        source: "NJ DCA — Bureau of Rooming and Boarding House Standards"
      },
      {
        text: "N.J.A.C. 5:27-1.6 says a Class F license is valid only for cooperative sober living residences, and no one may own or operate a rooming or boarding house without a license from the Bureau. A facility already operating as a cooperative sober living residence must get a Class F license to keep operating.",
        source: "N.J.A.C. 5:27-1.4 and 5:27-1.6"
      },
      {
        text: "A cooperative sober living residence is a home only for people recovering from drug or alcohol addiction. The rules cap occupancy at 10 residents besides the operators, require an alcohol- and drug-free environment, and bar the licensee from providing on-site counseling, therapy, or clinical treatment.",
        source: "N.J.A.C. 5:27-2.1"
      }
    ],
    steps: [
      "Read N.J.A.C. 5:27, including Subchapter 13 for Class F cooperative sober living residences.",
      "Complete License Application Form I for the owner or operator and Form II for each building. Mail them, with the fee, to the Bureau of Rooming and Boarding House Standards, 101 South Broad Street, P.O. Box 804, Trenton, NJ 08625-0804.",
      "Use the Bureau fee schedule. Class F starts at $356 for 2–5 residents and is $412 for 6–10 residents. A license issued to a corporation, partnership, or association is $666, and the total fee cannot exceed $666.",
      "Plan the house around the Class F definition: two operators, one of whom lives in the house; one operator on site from 7 p.m. to 7 a.m. when residents are there; no more than 10 residents besides the operators; no on-site clinical treatment; and no food, laundry, or other personal services from the licensee.",
      "The Bureau conducts the physical and social evaluations used for licensure and for yearly renewal. Questions: (609) 984-1704."
    ],
    links: [
      {
        title: "Bureau of Rooming and Boarding House Standards",
        href: "https://www.nj.gov/dca/codes/offices/roomingboarding.shtml",
        source: "nj.gov · DCA",
        description: "Applications, the fee schedule, and the Bureau phone and mailing address."
      },
      {
        title: "N.J.A.C. 5:27 — rooming and boarding houses, including Class F",
        href: "https://www.nj.gov/dca/codes/codreg/pdf_regs/njac_5_27.pdf",
        source: "nj.gov · DCA",
        description: "Official regulations through the March 3, 2025 New Jersey Register, including Subchapter 13."
      },
      {
        title: "Class F rule adoption (effective January 6, 2025)",
        href: "https://www.nj.gov/dca/codes/codreg/pdf_rule_adoptions/cslr_adopt.pdf",
        source: "nj.gov · DCA",
        description: "The adopted Class F amendments and Subchapter 13."
      },
      {
        title: "License application Form I",
        href: "https://www.nj.gov/dca/codes/forms/pdf_rooming/App_Form_I_fill.pdf",
        source: "nj.gov · DCA",
        description: "Owner and operator application. Make the check payable to Treasurer, State of New Jersey."
      },
      {
        title: "License application Form II",
        href: "https://www.nj.gov/dca/codes/forms/pdf_rooming/App_Form_II.pdf",
        source: "nj.gov · DCA",
        description: "Building information. Complete one for each address."
      },
      {
        title: "Licensing fee schedule",
        href: "https://www.nj.gov/dca/codes/forms/pdf_rooming/Lic_Fee_Schedule.pdf",
        source: "nj.gov · DCA",
        description: "Class F fees by number of residents, under N.J.A.C. 5:27-1.6."
      }
    ],
    local: {
      label: "County alcohol and drug offices, and county social service agencies",
      description:
        "DMHAS lists a county alcohol and drug use director and a county mental health administrator for each county. The Division of Family Development lists the county social service agency that takes SNAP and cash-assistance applications.",
      links: [
        {
          title: "County Alcohol and Drug Use Directors and County Mental Health Administrators",
          href: "https://www.nj.gov/humanservices/dmhas/about/boards/admin/",
          source: "nj.gov · DMHAS"
        },
        {
          title: "County social service agencies",
          href: "https://www.nj.gov/humanservices/dfd/counties/",
          source: "nj.gov · Division of Family Development",
          description: "Directory of the county agencies that take applications for SNAP and other family benefits."
        }
      ]
    },
    narrNote:
      "None confirmed. NARR’s affiliate page could not be reopened during this check (HTTP 403). No New Jersey organization is linked here as a NARR affiliate because one was not confirmed on narronline.org.",
    funding: [
      {
        text: "The Department of Human Services posts requests for proposals on a standing notices page. That page is where DMHAS grant notices are published. Open items change, so read the current notice before you apply. Closed one-time awards are not listed here.",
        source: "NJ DHS — Requests for Proposals"
      }
    ],
    fundingLinks: [newJerseyDhsProposals],
    faq: [
      {
        question: "Do I need a license to run a cooperative sober living residence?",
        answer:
          "Yes. N.J.A.C. 5:27-1.6 says no one may own or operate a rooming or boarding house without a Bureau license, and a Class F license is the class valid only for cooperative sober living residences. A home already operating as one must get a Class F license to continue.",
        source: "N.J.A.C. 5:27-1.4(b) and 5:27-1.6"
      },
      {
        question: "How many residents can live there?",
        answer: "Occupancy cannot exceed 10 people, not counting the operators.",
        source: "N.J.A.C. 5:27-2.1"
      },
      {
        question: "What staffing does Class F require?",
        answer:
          "The residence must be managed by an entity that provides two operators. One must be on site from 7 p.m. to 7 a.m. when residents are there. At least one operator must live in the residence, set the house rules, and exercise some control over the operation.",
        source: "N.J.A.C. 5:27-2.1"
      },
      {
        question: "Can the house provide treatment?",
        answer:
          "No. The Class F definition bars the licensee from providing on-site counseling, therapy, clinical treatment, or alcohol or drug treatment, and from providing food, laundry, financial, or other personal services. The licensee may, at its discretion, provide non-clinical recovery and support services, and may encourage off-site services or self-help programs.",
        source: "N.J.A.C. 5:27-2.1"
      },
      {
        question: "What does the license cost?",
        answer:
          "The Bureau fee schedule lists Class F at $356 for 2–5 residents and $412 for 6–10 residents. A license issued to a corporation, partnership, or association is $666. The total fee cannot exceed $666. Put the facility address or control number on the check.",
        source: "DCA licensing fee schedule; N.J.A.C. 5:27-1.6"
      },
      {
        question: "Can house rules include drug testing and a curfew?",
        answer:
          "Yes. Subchapter 13 says Class F house rules may require weekly drug and alcohol screening. They may also set a reasonable curfew, which does not apply when a resident is at a recovery or work activity and cannot block reasonable errands or visits.",
        source: "N.J.A.C. 5:27-13.2"
      },
      {
        question: "What has to be reported after a serious incident?",
        answer:
          "The licensee must call the Department immediately at (609) 984-1704, then confirm in writing within 72 hours, when first responders respond to a serious incident such as a death, overdose, or assault. The notice is limited to the date, time, and nature of the incident. Class F homes must also provide lockboxes for prescription medication, and bedroom doors cannot have keyed locks or deadbolts.",
        source: "N.J.A.C. 5:27-13.3"
      },
      {
        question: "Is there a state training catalog for Class F operators?",
        answer:
          "No public Class F training catalog or correspondence list was found on the Bureau’s site. The Bureau’s application page and phone, (609) 984-1704, are the official contacts for licensing questions.",
        source: "NJ DCA — Bureau of Rooming and Boarding House Standards"
      }
    ],
    gaps: [
      "No public Class F training catalog, webinar series, or operator correspondence list was found.",
      "No New Jersey NARR affiliate was confirmed on narronline.org. The affiliate page returned HTTP 403 during this check, so it was not re-listed."
    ]
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
        source: "Del. Code tit. 16, § 2202A"
      },
      {
        text: "Except for certified recovery houses, Oxford Houses, or houses authorized by the Division, it is unlawful for a recovery house to accept state or local funding. Advertising a house as certified when it isn’t is also unlawful.",
        source: "Del. Code tit. 16, §§ 2213A–2214A"
      },
      {
        text: "DSAMH identifies the First State Alliance of Recovery Residences (FSARR) as the certifying body for sober living houses and as Delaware’s NARR affiliate. FSARR publishes the certification stages operators follow.",
        source: "DHSS Joint Finance Committee hearing; FSARR"
      }
    ],
    steps: [
      "Read Title 16, Chapter 22A. Certification is voluntary, and a house that is not certified, an Oxford House, or authorized by DSAMH cannot take state or local funding.",
      "On FSARR’s site, review the NARR levels of support and choose the level that matches the house.",
      "Submit FSARR’s lead contact form. FSARR says a staff member follows up with a screening call.",
      "FSARR invites you to create an account in its certification portal, then adds a compliance agreement and the application for you to sign and complete.",
      "Upload policies, procedures, and supporting documents. FSARR reviews them and tells you what to correct. The FSARR certification manual says required documents must be submitted within 90 days of starting an application.",
      "FSARR schedules an on-site inspection. Two staff members audit the home and interview residents and staff. If updates are needed, FSARR sets a timeline. The certificate FSARR sends is good for 1 year."
    ],
    links: [
      { title: "Delaware Code Title 16, Chapter 22A — Recovery Housing", href: "https://delcode.delaware.gov/title16/c022a/index.html", source: "delcode.delaware.gov" },
      {
        title: "DHSS Joint Finance Committee hearing — DSAMH",
        href: "https://dhss.delaware.gov/wp-content/uploads/2025/12/dsamh2025hearing.pdf",
        source: "dhss.delaware.gov",
        description: "DSAMH’s hearing materials name FSARR as the certifying body for sober living houses under the recovery-house law."
      },
      {
        title: "FSARR stages of certification",
        href: "https://fsarr.org/certification/",
        source: "fsarr.org",
        description: "The public step-by-step certification path, from level selection through the one-year certificate."
      },
      {
        title: "FSARR resources and certification manual",
        href: "https://fsarr.org/resources/",
        source: "fsarr.org",
        description: "Documentation checklist and the certification manual. Contact listed on the page: info@fsarr.org."
      },
      {
        title: "FSARR certification manual (PDF)",
        href: "https://fsarr.org/wp-content/uploads/FSARR-Certification-Manual-2025.pdf",
        source: "fsarr.org",
        description: "The written protocol: portal account, application, document review, and on-site assessment."
      },
      {
        title: "DSAMH contact and community offices",
        href: "https://dhss.delaware.gov/dsamh/division-of-substance-abuse-and-mental-health/contact-dsamh/",
        source: "dhss.delaware.gov · DSAMH"
      }
    ],
    local: {
      label: "DSAMH community offices",
      description:
        "Delaware is one behavioral-health division, not a county-authority system like Pennsylvania’s SCAs. DSAMH lists community mental health centers and treatment access centers in Wilmington (New Castle County), Dover (Kent County), and Georgetown (Sussex County). The main office is the Herman M. Holloway Sr. Campus, 1901 N. DuPont Highway, New Castle, (302) 255-9399.",
      links: [
        {
          title: "Contact DSAMH",
          href: "https://dhss.delaware.gov/dsamh/division-of-substance-abuse-and-mental-health/contact-dsamh/",
          source: "dhss.delaware.gov · DSAMH",
          description: "Main office, community mental health centers, and treatment access centers in all three counties."
        },
        {
          title: "Publicly funded addiction treatment programs",
          href: "https://dhss.delaware.gov/dsamh/division-of-substance-abuse-and-mental-health/publicly-funded-addiction-treatment-programs/",
          source: "dhss.delaware.gov · DSAMH",
          description: "County treatment sites DSAMH contracts with for people who are uninsured or underinsured."
        }
      ]
    },
    narrAffiliate: {
      title: "First State Alliance of Recovery Residences (FSARR)",
      href: "https://fsarr.org/",
      source: "fsarr.org",
      description: "Delaware’s NARR affiliate. DSAMH’s hearing materials name FSARR as the certifying body. The NARR affiliate directory itself returned HTTP 403 during this check."
    },
    funding: [
      {
        text: "Chapter 22A creates a Certified Recovery House Fund. The statute assigns DSAMH to contract with the certifying organization. It does not, by itself, list an open operator grant.",
        source: "Del. Code tit. 16, §§ 2202A and 2216A"
      },
      {
        text: "DSAMH posts current funding solicitations on the Addiction Treatment Resource Center funding page. Check that page for what is open. A specific recovery-residence request for proposals was not listed here because its current status was not confirmed.",
        source: "DSAMH ATRC — Funding Opportunities"
      }
    ],
    fundingLinks: [delawareDsamhFunding],
    faq: [
      {
        question: "Do I have to be certified to operate?",
        answer:
          "Certification is voluntary. A recovery house that is not a certified recovery house, an Oxford House, or authorized by DSAMH cannot accept state or local funding. Advertising a house as certified when it is not is unlawful.",
        source: "Del. Code tit. 16, §§ 2213A–2214A"
      },
      {
        question: "Who certifies houses?",
        answer:
          "The statute tells DSAMH to contract with a certifying organization. DSAMH’s budget materials name the First State Alliance of Recovery Residences (FSARR) as that body, and DSAMH procurement materials call FSARR Delaware’s NARR affiliate.",
        source: "Del. Code tit. 16, § 2202A; DHSS hearing materials; DSAMH procurement materials"
      },
      {
        question: "How do I apply?",
        answer:
          "FSARR’s public stages are: pick a NARR level, submit the lead contact form, create the portal account FSARR invites you to, sign the compliance agreement, complete the application, upload policies and documents, pass the on-site inspection, and make any required updates.",
        source: "FSARR — Stages of Certification"
      },
      {
        question: "How long does a certificate last?",
        answer:
          "FSARR’s certification page says the certificate it sends is good for 1 year. The statute separately requires the certifying organization to set certification and required 2-year renewal applications. Read both before you rely on a renewal date.",
        source: "FSARR certification page; Del. Code tit. 16, § 2202A(b)(1)"
      },
      {
        question: "Is training required?",
        answer:
          "The statute requires the certifying organization to develop and provide training and technical assistance for recovery houses. FSARR’s certification path and manual are the published training and documentation materials. A separate public webinar calendar was not found.",
        source: "Del. Code tit. 16, § 2202A(b)(12); FSARR"
      },
      {
        question: "Where do I ask about treatment funding in my county?",
        answer:
          "DSAMH’s contact page lists community mental health centers and treatment access centers in Wilmington, Dover, and Georgetown. The main line is (302) 255-9399. The publicly funded treatment page lists contracted sites for people without enough insurance.",
        source: "DSAMH contact page; DSAMH publicly funded treatment page"
      },
      {
        question: "Where are current grants posted?",
        answer:
          "On the DSAMH Addiction Treatment Resource Center funding page. Chapter 22A also creates a Certified Recovery House Fund. This page does not list a one-time award whose deadline could not be confirmed.",
        source: "DSAMH ATRC — Funding Opportunities; Del. Code tit. 16, § 2216A"
      }
    ],
    gaps: [
      "No separate public DSAMH or FSARR webinar signup, outside the FSARR certification materials, was found.",
      "A recovery-residence request for proposals was found, but whether it is still open was not confirmed, so it is not listed as a current grant."
    ]
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
        text: "Under COMAR 10.63.08.03, a recovery residence must be certified by the Department’s designated credentialing entity if it receives state funds or is operated, advertised, or represented as a certified recovery residence. A chartered Oxford House is exempt. Each residence needs its own certificate.",
        source: "COMAR 10.63.08.03"
      },
      {
        text: "The Maryland Certification of Recovery Residences office at the Behavioral Health Administration provides statewide certification. Applications go to that credentialing entity. An initial or renewal certificate of compliance lasts 1 year. A provisional certificate lasts no longer than 6 months.",
        source: "MCORR page; COMAR 10.63.08.07"
      }
    ],
    steps: [
      "Read COMAR 10.63.08 and the MCORR page. Certification is required to receive state funds or to hold the house out as certified. A chartered Oxford House is exempt.",
      "Submit one complete application for each residence to the Department’s designated credentialing entity, MCORR at the Behavioral Health Administration.",
      "Include the materials in COMAR 10.63.08.04: ownership or lease and owner permission if you are not the owner, fire and liability and hazard insurance, the legal entity, attestations of compliance with health, safety, building, fire, and zoning laws, a policy manual, mission and vision statements, a resident handbook, a sample resident agreement, a safety checklist, and an emergency plan.",
      "The credentialing entity reviews the application for completeness and accuracy. If it is complete, the entity arranges an inspection. It may also inspect without notice.",
      "If approved, the certificate of compliance is issued for that residence. Initial and renewal certificates last 1 year. Apply for renewal at least 90 days before the current certificate expires. Renewal applications must show that the owner or operator, staff, volunteers, and peers completed the trainings the Department mandates.",
      "MCORR’s published contact is the Division of Policy and Planning, 55 Wade Avenue, Catonsville, MD 21228, 410-402-8300, Monday through Friday, 9 a.m. to 5 p.m."
    ],
    links: [
      {
        title: "Maryland Certification of Recovery Residences (MCORR)",
        href: "https://health.maryland.gov/bha/Pages/Maryland-Certification-of-Recovery-Residence-License-.aspx",
        source: "health.maryland.gov · BHA",
        description: "Who certifies recovery residences, and the Catonsville office contact."
      },
      {
        title: "COMAR 10.63.08 — Recovery Residence Certification",
        href: "https://health.maryland.gov/regs/Pages/10-63-08-Recovery-Residence-Certification-(---.aspx",
        source: "health.maryland.gov",
        description: "Who must be certified, the application contents, inspection, and how long a certificate lasts."
      },
      {
        title: "Health-General § 19-2502",
        href: "https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=ghg&section=19-2502&enactments=false",
        source: "mgaleg.maryland.gov",
        description: "The statute on recovery residence certification."
      },
      {
        title: "MDH report on recovery residence oversight",
        href: "https://dlslibrary.state.md.us/publications/Exec/MDH/HB722Ch697(2025)_2025.pdf",
        source: "dlslibrary.state.md.us · Maryland Department of Legislative Services",
        description: "The Department’s description of the MCORR application review and on-site inspection."
      }
    ],
    local: {
      label: "Local behavioral health authorities",
      description:
        "Maryland’s public behavioral health system is local. The Behavioral Health Administration’s local jurisdictions page is the directory of each jurisdiction’s behavioral health authority, the closest equivalent to Pennsylvania’s Single County Authorities.",
      links: [
        {
          title: "BHA local jurisdictions",
          href: "https://health.maryland.gov/bha/Pages/local-jurisdiction.aspx",
          source: "health.maryland.gov · BHA"
        }
      ]
    },
    narrNote:
      "None confirmed. Maryland certifies recovery residences through MCORR, using NARR standards in COMAR 10.63.08. NARR’s affiliate page could not be reopened during this check (HTTP 403), and no Maryland NARR affiliate is linked here.",
    funding: [
      {
        text: "COMAR 10.63.08.03 requires certification before a recovery residence receives state funds or holds itself out as certified. Maryland’s Governor’s Grants Office is the standing page where state agencies post grant opportunities. Open notices change. Closed one-time awards are not listed here.",
        source: "COMAR 10.63.08.03; Maryland Governor’s Grants Office"
      }
    ],
    fundingLinks: [marylandGrantsOffice],
    faq: [
      {
        question: "Do I need MCORR certification to open?",
        answer:
          "You need it if the house receives state funds, or if anyone operates, advertises, or represents it as a certified recovery residence. A chartered Oxford House that follows its charter is exempt.",
        source: "COMAR 10.63.08.03"
      },
      {
        question: "Is one certificate enough for several houses?",
        answer: "No. COMAR requires a separate certificate for each residence that must be certified.",
        source: "COMAR 10.63.08.03"
      },
      {
        question: "What do I submit?",
        answer:
          "A complete application for that address, including ownership or lease documents, insurance, the legal entity, local health, safety, building, fire, and zoning attestations, a policy manual aligned with the NARR 2015 quality standards or their successor, mission and vision statements, a resident handbook, a sample resident agreement, a safety checklist, and an emergency plan.",
        source: "COMAR 10.63.08.04"
      },
      {
        question: "Will someone inspect the house?",
        answer:
          "Yes. If the application is complete and accurate, the credentialing entity arranges an inspection. It may also inspect, and copy financial and resident records, at any time without notice. The Department’s oversight report describes a document review followed by an on-site inspection before a certificate is issued.",
        source: "COMAR 10.63.08.05; MDH oversight report"
      },
      {
        question: "How long does a certificate last?",
        answer:
          "An initial certificate lasts 1 year from the date of issue. A renewal lasts 1 year from the date the current certificate expires. A provisional certificate lasts no longer than 6 months. Apply for renewal at least 90 days before the current certificate expires.",
        source: "COMAR 10.63.08.04 and 10.63.08.07"
      },
      {
        question: "Is there required training?",
        answer:
          "For a renewal, the application must show that the owner or operator, staff, volunteers, and peers completed the trainings mandated by the Department. A public catalog or webinar signup for those trainings was not found. MCORR’s published phone is 410-402-8300.",
        source: "COMAR 10.63.08.04; MCORR page"
      },
      {
        question: "Where do I ask about local behavioral health funding?",
        answer:
          "Start with the Behavioral Health Administration’s local jurisdictions directory. Statewide grant notices are posted by the Governor’s Grants Office.",
        source: "BHA local jurisdictions page; Maryland Governor’s Grants Office"
      }
    ],
    gaps: [
      "No public MCORR training catalog, webinar series, or correspondence list was found. COMAR requires Department-mandated training at renewal, but does not publish the course list.",
      "No Maryland NARR affiliate was confirmed. The NARR affiliate page returned HTTP 403 during this check.",
      "A stable public page for Maryland RecoveryNet operator funding was not confirmed, so that program is not described here."
    ]
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
