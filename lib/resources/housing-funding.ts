/**
 * Recovery-housing funders: grant programs, loan funds, settlement trusts,
 * and resident rent or income help. Not treatment locators or directories of houses.
 * `ownerGuide: false` keeps individual benefits off the owner funding list.
 */
export type HousingFundingResource = {
  state: string | null;
  category: "funding";
  title: string;
  description: string;
  url: string;
  source: string;
  tags?: string[];
  /** Included on the owner guide when omitted. Set false for individual benefits. */
  ownerGuide?: boolean;
  /** Also list the resource under First Responders & 9/11 on the veterans tab. */
  crossList?: "first-responders";
};

export const housingFundingResources: HousingFundingResource[] = [
  {
    state: null,
    category: "funding" as const,
    title: "HUD Recovery Housing Program",
    description: "Federal program that gives states funds for temporary housing for people in recovery from a substance use disorder.",
    url: "https://www.hudexchange.info/programs/rhp/",
    source: "HUD Exchange"
  },
  {
    state: null,
    category: "funding" as const,
    title: "HUD Continuum of Care",
    description: "Federal homelessness grants that communities can use for housing, including recovery housing for people leaving homelessness.",
    url: "https://www.hudexchange.info/programs/coc/",
    source: "HUD Exchange"
  },
  {
    state: null,
    category: "funding" as const,
    title: "Oxford House start-up loans",
    description: "How Oxford House uses a small revolving loan for the first month’s rent and deposit when a new self-run house opens.",
    url: "https://www.oxfordhouse.org/faq",
    source: "Oxford House"
  },
  {
    state: null,
    category: "funding" as const,
    title: "Fletcher Group",
    description: "National nonprofit that helps rural communities plan and finance recovery housing.",
    url: "https://www.fletchergroup.org/",
    source: "Fletcher Group"
  },
  {
    state: null,
    category: "funding" as const,
    title: "Recovery housing funding sources",
    description: "SAMHSA brief, based on NARR affiliates, on how recovery housing is paid for, including grants and opioid settlement funds.",
    url: "https://library.samhsa.gov/product/recovery-housing-funding-sources-and-financial-sustainability/pep26-08-001",
    source: "SAMHSA"
  },
  {
    state: "PA",
    category: "funding" as const,
    tags: ["Pennsylvania"],
    title: "Pennsylvania Opioid Misuse and Addiction Abatement Trust",
    description: "Distributes Pennsylvania’s opioid settlement funds to the state and counties, which decide local uses such as recovery housing.",
    url: "https://www.paopioidtrust.org/",
    source: "Pennsylvania Opioid Trust"
  },
  {
    state: "NJ",
    category: "funding" as const,
    title: "New Jersey opioid settlements",
    description: "How New Jersey’s opioid settlement dollars are split between the state and local governments for prevention, treatment, and recovery.",
    url: "https://www.nj.gov/opioidfunds/",
    source: "State of New Jersey"
  },
  {
    state: "MD",
    category: "funding" as const,
    title: "Maryland Recovery Housing Program",
    description: "State-run HUD recovery housing grants for counties, including projects for women in recovery who are pregnant or parenting.",
    url: "https://dhcd.maryland.gov/neighborhood-revitalization/community-development-funding/community-development-block-grant-program/recovery-housing-program",
    source: "Maryland DHCD"
  },
  {
    state: "DE",
    category: "funding" as const,
    title: "Delaware Opioid Settlement Commission",
    description: "Awards Delaware opioid settlement and impact-fee funds, including community grants for recovery support.",
    url: "https://deopioidsettlementfunds.org/",
    source: "Delaware Opioid Settlement Commission"
  },
  {
    state: "OH",
    category: "funding" as const,
    title: "Ohio recovery housing funding awards",
    description: "Ohio’s record of state general-revenue and capital funds used to develop and expand recovery housing.",
    url: "https://dbh.ohio.gov/supporting-providers/housing-providers/recovery-housing-residences/funding-awards",
    source: "Ohio Department of Behavioral Health"
  },
  {
    state: "PA",
    category: "funding",
    tags: ["Pennsylvania", "rent help", "scholarship", "DDAP", "move-in", "recovery house"],
    title: "PA Bridge to Recovery Housing",
    description:
      "Bridge Foundation scholarship for one month of rent plus entry and move-in fees at a Pennsylvania DDAP-licensed recovery house, while funds last. Apply within 14 days of move-in. It does not cover back rent. Call (855) 284-3274. Scholarship application: https://bridge-foundation.org/bridgetorecoveryhousing/scholarship-application/. Find a licensed house in the Aftercare Compass search.",
    url: "https://bridge-foundation.org/bridgetorecoveryhousing/",
    source: "Bridge Foundation"
  },
  {
    state: "MD",
    category: "funding",
    tags: ["Maryland", "rent help", "scholarship", "recovery housing", "MDRN"],
    title: "Maryland RecoveryNet (MDRN) recovery housing",
    description:
      "Time-limited Maryland funding, commonly 60 days a year, for a certified recovery residence and care coordination. You must live in Maryland, be in substance use treatment, and have income at or under 250% of the federal poverty level. A State Care Coordinator submits the request. Call 443-835-8692. Find a certified residence in the Aftercare Compass search.",
    url: "https://health.maryland.gov/bha/Pages/Maryland-RecoveryNet-(MDRN)-License-.aspx",
    source: "Maryland Behavioral Health Administration"
  },
  {
    state: null,
    category: "funding",
    ownerGuide: false,
    crossList: "first-responders",
    tags: ["9/11", "911", "September 11", "first responder", "firefighter", "FDNY", "PTSD", "compensation"],
    title: "September 11th Victim Compensation Fund",
    description:
      "Cash compensation for a certified 9/11-related physical condition. PTSD alone does not qualify, but registering preserves the right to file. Call 1-855-885-1555.",
    url: "https://www.vcf.gov/",
    source: "September 11th Victim Compensation Fund"
  },
  {
    state: null,
    category: "funding",
    ownerGuide: false,
    crossList: "first-responders",
    tags: ["9/11", "911", "September 11", "first responder", "firefighter", "FDNY", "PTSD", "financial assistance"],
    title: "FealGood Foundation",
    description:
      "Financial assistance for 9/11 responders and emergency personnel who were injured in the line of duty. Call 631-724-3320.",
    url: "https://fealgoodfoundation.com/",
    source: "FealGood Foundation"
  },
  {
    state: null,
    category: "funding",
    ownerGuide: false,
    tags: ["PTSD", "disability", "Social Security", "SSDI", "income"],
    title: "Social Security Disability Insurance (SSDI)",
    description:
      "Monthly income if a condition, including documented PTSD, keeps you from working for 12 months or longer. Call 1-800-772-1213.",
    url: "https://www.ssa.gov/applyfordisability/",
    source: "Social Security Administration"
  }
];
