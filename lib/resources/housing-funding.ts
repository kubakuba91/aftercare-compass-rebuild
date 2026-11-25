/**
 * Recovery-housing funders: grant programs, loan funds, and settlement trusts.
 * Not treatment locators or directories of houses.
 */
export const housingFundingResources = [
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
  }
];
