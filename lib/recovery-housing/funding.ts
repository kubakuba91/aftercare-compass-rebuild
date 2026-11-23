import type { ResourceLink } from "./types";

// Standing funding pages for recovery house operators. Checked live on 2026-11-23.
// Do not add one-time awards that have already closed.

export const ddapFundingOpportunities: ResourceLink = {
  title: "DDAP Funding Opportunities",
  href: "https://www.pa.gov/agencies/ddap/for-professionals/funding-opportunities",
  source: "pa.gov · DDAP",
  description: "Current Pennsylvania DDAP grant announcements. Questions about DDAP grants go to RA-DAGRANTSMGMT@pa.gov."
};

export const federalOwnerFunding: ResourceLink[] = [
  {
    title: "SAMHSA grants",
    href: "https://www.samhsa.gov/grants",
    source: "samhsa.gov",
    description: "Federal grant announcements for mental health and substance use programs. Open notices change, so read the current announcement before you apply."
  },
  {
    title: "SAMHSA substance use and mental health block grants",
    href: "https://www.samhsa.gov/grants/block-grants",
    source: "samhsa.gov",
    description:
      "Block grants go to states, which then fund local prevention, treatment, and recovery services. Operators usually apply through the state agency rather than to SAMHSA directly."
  }
];

export const delawareDsamhFunding: ResourceLink = {
  title: "Delaware DSAMH funding opportunities",
  href: "https://atrc.dhss.delaware.gov/funding-opportunities",
  source: "atrc.dhss.delaware.gov · DSAMH",
  description: "Addiction Treatment Resource Center page where Delaware DSAMH posts current funding solicitations."
};

export const marylandGrantsOffice: ResourceLink = {
  title: "Maryland Governor’s Grants Office",
  href: "https://grants.maryland.gov/Pages/Grants-Office.aspx",
  source: "grants.maryland.gov",
  description: "Maryland’s official grants office, where state agencies post grant opportunities."
};

export const newJerseyDhsProposals: ResourceLink = {
  title: "New Jersey DHS requests for proposals",
  href: "https://www.nj.gov/humanservices/notices/grants/proposals/",
  source: "nj.gov · Department of Human Services",
  description: "Standing page for Department of Human Services grant notices, including the Division of Mental Health and Addiction Services."
};

export const stateOwnerFunding: ResourceLink[] = [
  ddapFundingOpportunities,
  delawareDsamhFunding,
  marylandGrantsOffice,
  newJerseyDhsProposals,
  {
    title: "New York OASAS funding",
    href: "https://oasas.ny.gov/funding",
    source: "oasas.ny.gov",
    description: "Office of Addiction Services and Supports funding page. Confirm which programs are open before you apply."
  },
  {
    title: "North Carolina DMH/DD/SUS grant opportunities",
    href: "https://www.ncdhhs.gov/divisions/mental-health-developmental-disabilities-and-substance-use-services/grants/mental-health-developmental-disabilities-and-substance-use-services-grant-opportunities",
    source: "ncdhhs.gov",
    description: "Grant opportunities from the Division of Mental Health, Developmental Disabilities, and Substance Use Services. Open items change and are not all for recovery housing."
  },
  {
    title: "Ohio Department of Behavioral Health — apply for funding",
    href: "https://dbh.ohio.gov/supporting-providers/apply-for-funding/apply-for-funding",
    source: "dbh.ohio.gov",
    description: "DBH funding opportunities for providers, ADAMH boards, and other organizations that provide treatment, prevention, or recovery services."
  },
  {
    title: "Tennessee TDMHSAS funding and procurement",
    href: "https://www.tn.gov/behavioral-health/department-funding-opportunities.html",
    source: "tn.gov · TDMHSAS",
    description: "Department funding and procurement announcements. Check the deadline on each announcement."
  },
  {
    title: "Virginia DBHDS WebGrants",
    href: "https://dbhds.virginia.gov/web-grants-management-system/",
    source: "dbhds.virginia.gov",
    description: "Portal where DBHDS partners apply for department funding, request reimbursement, and report on grants."
  }
];

/** States in the picker with no verified standing funding-board page. */
export const ownerFundingGaps = ["Connecticut", "Florida", "Georgia", "Massachusetts", "South Carolina", "West Virginia"];
