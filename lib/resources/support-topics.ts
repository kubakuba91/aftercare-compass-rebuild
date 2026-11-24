/**
 * Support resources for the public locator.
 * Meeting finders, family supports, benefits, and veterans offices only.
 * No treatment locators, prescriber finders, or directories of programs or homes.
 */
export type SupportResource = {
  state: string | null;
  category: "recovery" | "family" | "veterans";
  title: string;
  description: string;
  url: string;
  source: string;
  area?: string;
};

export const supportResources: SupportResource[] = [
  {
    state: null,
    category: "recovery",
    title: "Find A.A. near you",
    description: "Alcoholics Anonymous directory of local offices, so you can connect someone with the meeting list for their area.",
    url: "https://www.aa.org/find-aa",
    source: "Alcoholics Anonymous"
  },
  {
    state: null,
    category: "recovery",
    title: "A.A. Meeting Guide",
    description: "Official A.A. app for finding in-person and online meetings that local committees keep up to date.",
    url: "https://www.aa.org/meeting-guide-app",
    source: "Alcoholics Anonymous"
  },
  {
    state: null,
    category: "recovery",
    title: "NA meeting search",
    description: "Narcotics Anonymous search for local and online meetings.",
    url: "https://www.na.org/meetingsearch/",
    source: "Narcotics Anonymous"
  },
  {
    state: null,
    category: "recovery",
    title: "SMART Recovery meetings",
    description: "Finder for in-person and online SMART Recovery mutual-support meetings.",
    url: "https://meetings.smartrecovery.org/",
    source: "SMART Recovery"
  },
  {
    state: null,
    category: "recovery",
    title: "Recovery Dharma meetings",
    description: "Finder for Recovery Dharma meetings, a Buddhist-informed mutual-support group.",
    url: "https://recoverydharma.org/meetings/",
    source: "Recovery Dharma"
  },
  {
    state: "PA",
    category: "recovery",
    area: "Eastern Pennsylvania",
    title: "Eastern Pennsylvania A.A. Area 59",
    description: "Meeting list for Alcoholics Anonymous groups across eastern Pennsylvania.",
    url: "https://area59aa.org/meetings/",
    source: "Area 59"
  },
  {
    state: "PA",
    category: "recovery",
    area: "Western Pennsylvania",
    title: "Western Pennsylvania A.A. Area 60",
    description: "Meeting search for Alcoholics Anonymous groups across western Pennsylvania.",
    url: "https://www.wpaarea60.org/meetings",
    source: "Area 60"
  },
  {
    state: "PA",
    category: "recovery",
    area: "Philadelphia",
    title: "Southeastern Pennsylvania Intergroup (SEPIA)",
    description: "A.A. meetings and the intergroup office for Philadelphia, Bucks, Chester, Delaware, and Montgomery counties.",
    url: "https://aasepia.org/meetings/",
    source: "SEPIA"
  },
  {
    state: "PA",
    category: "recovery",
    area: "Lancaster",
    title: "Lancaster A.A. Intergroup",
    description: "A.A. meetings and the central office for Lancaster County. Helpline 717-394-3238.",
    url: "https://lancasteraa.org/",
    source: "Lancaster Intergroup"
  },
  {
    state: "PA",
    category: "recovery",
    area: "Harrisburg",
    title: "Harrisburg Area A.A. Intergroup",
    description: "A.A. meeting list and intergroup office for the Harrisburg area. Helpline 717-234-5390.",
    url: "https://www.aaharrisburg.org/meetings/",
    source: "Harrisburg Area Intergroup"
  },
  {
    state: "PA",
    category: "recovery",
    area: "Pittsburgh",
    title: "Pittsburgh Area A.A. Central Office",
    description: "A.A. meeting list and central office for the Pittsburgh area. Helpline 412-471-7472.",
    url: "https://pghaa.org/meetings.htm",
    source: "Pittsburgh Area Central Office"
  },
  {
    state: "PA",
    category: "recovery",
    area: "Greater Philadelphia",
    title: "Greater Philadelphia Region of NA",
    description: "Current NA meeting lists for Philadelphia and the surrounding Pennsylvania counties.",
    url: "https://meetinglists.gprna.org/",
    source: "Greater Philadelphia Region of NA"
  },
  {
    state: "PA",
    category: "recovery",
    area: "Eastern Pennsylvania",
    title: "Eastern Pennsylvania Region of NA",
    description: "NA meetings for the Eastern Pennsylvania Region, including parts of the Lehigh Valley and nearby counties.",
    url: "https://eparna.org/",
    source: "EPARNA"
  },
  {
    state: "PA",
    category: "recovery",
    area: "Central Pennsylvania",
    title: "Mid-Atlantic Region of NA",
    description: "NA meeting search for central Pennsylvania, from the New York line to the Maryland line.",
    url: "https://marscna.org/bmlt-meeting-search/",
    source: "Mid-Atlantic Region of NA"
  },
  {
    state: "PA",
    category: "recovery",
    area: "Western Pennsylvania",
    title: "Tri-State Region of NA",
    description: "NA meeting lists for western Pennsylvania, including Pittsburgh, plus nearby Ohio and West Virginia.",
    url: "https://tristate-na.org/meetings/",
    source: "Tri-State Region of NA"
  },
  {
    state: "MD",
    category: "recovery",
    title: "Maryland A.A. Area 29",
    description: "Maryland General Service for Alcoholics Anonymous, including how to reach local intergroups and districts.",
    url: "https://www.marylandaa.org/",
    source: "Maryland General Service"
  },
  {
    state: "MD",
    category: "recovery",
    area: "Baltimore",
    title: "Baltimore Intergroup of A.A.",
    description: "A.A. meeting schedule and intergroup office for the Baltimore area. Helpline 410-663-1922.",
    url: "https://baltimoreaa.org/",
    source: "Baltimore Intergroup"
  },
  {
    state: "MD",
    category: "recovery",
    title: "Free State Region of NA",
    description: "NA meetings for Baltimore, eastern and northern Maryland, and Delaware. Helpline 1-800-317-3222.",
    url: "https://freestatena.org/all-meetings",
    source: "Free State Region of NA"
  },
  {
    state: "MD",
    category: "recovery",
    title: "Chesapeake & Potomac Region of NA",
    description: "NA meeting map for the Maryland suburbs of Washington, the District, and northern Virginia.",
    url: "https://www.cprna.org/meeting-search-engine/",
    source: "Chesapeake & Potomac Region of NA"
  },
  {
    state: "DE",
    category: "recovery",
    title: "Delaware A.A. Area 12",
    description: "Delaware General Service Assembly, the statewide A.A. service body, with links toward local meetings.",
    url: "https://www.delawareaa.org/",
    source: "Area 12"
  },
  {
    state: "DE",
    category: "recovery",
    area: "Northern Delaware",
    title: "Northern Delaware A.A. Intergroup",
    description: "A.A. meetings and the Wilmington-area intergroup office. Helpline 302-655-5113.",
    url: "https://ndiaa.org/",
    source: "Northern Delaware Intergroup"
  },
  {
    state: "DE",
    category: "recovery",
    area: "Central Delaware",
    title: "Central Delaware A.A. Intergroup",
    description: "A.A. meetings for the Dover and central Delaware area.",
    url: "https://www.cdiaa-de.org/cdiaa/",
    source: "Central Delaware Intergroup"
  },
  {
    state: "DE",
    category: "recovery",
    area: "Southern Delaware",
    title: "Southern Delaware A.A. Intergroup",
    description: "A.A. meetings for Sussex County. Helpline 302-856-6452.",
    url: "https://sussexaa.org/",
    source: "Southern Delaware Intergroup"
  },
  {
    state: "DE",
    category: "recovery",
    title: "Free State Region of NA",
    description: "NA meetings covering Delaware as well as Baltimore and eastern and northern Maryland. Helpline 1-800-317-3222.",
    url: "https://freestatena.org/all-meetings",
    source: "Free State Region of NA"
  },
  {
    state: "NJ",
    category: "recovery",
    area: "Northern New Jersey",
    title: "Northern New Jersey A.A. Intergroup (Area 44)",
    description: "A.A. meeting finder and intergroup for northern New Jersey. Helpline 908-687-8566.",
    url: "https://www.nnjaa.org/",
    source: "Northern New Jersey Intergroup"
  },
  {
    state: "NJ",
    category: "recovery",
    area: "Southern and central New Jersey",
    title: "Southern New Jersey A.A. Area 45",
    description: "General service site for southern and central New Jersey, with local intergroup hotlines for meetings.",
    url: "https://area45snjaa.org/",
    source: "Area 45"
  },
  {
    state: "NJ",
    category: "recovery",
    area: "South Jersey",
    title: "South Jersey A.A. Intergroup",
    description: "A.A. meetings for Burlington, Camden, Gloucester, Salem, Cumberland, and nearby counties. Helpline 856-486-4444.",
    url: "https://aasj.org/",
    source: "South Jersey Intergroup"
  },
  {
    state: "NJ",
    category: "recovery",
    title: "New Jersey Region of NA",
    description: "Statewide NA meeting finder for in-person, hybrid, and online meetings. Helpline 800-992-0401.",
    url: "https://www.nanj.org/meeting-finder/",
    source: "Narcotics Anonymous of New Jersey"
  },
  {
    state: null,
    category: "family",
    title: "Al-Anon meeting search",
    description: "Meetings for relatives and friends who are worried about someone else’s drinking.",
    url: "https://al-anon.org/al-anon-meetings/find-an-al-anon-meeting/",
    source: "Al-Anon Family Groups"
  },
  {
    state: null,
    category: "family",
    title: "Alateen",
    description: "Al-Anon meetings and information for teenagers affected by someone else’s drinking.",
    url: "https://al-anon.org/newcomers/teen-corner-alateen/",
    source: "Al-Anon Family Groups"
  },
  {
    state: null,
    category: "family",
    title: "Nar-Anon meetings",
    description: "Meetings for families and friends affected by someone else’s drug use, including Narateen for teens.",
    url: "https://nar-anon.org/meetings-page/",
    source: "Nar-Anon Family Groups"
  },
  {
    state: null,
    category: "family",
    title: "SAMHSA resources for families",
    description: "Guidance for families supporting a loved one with a mental health or substance use problem, including how to talk and how to look after themselves.",
    url: "https://www.samhsa.gov/mental-health/children-and-families/coping-resources",
    source: "SAMHSA"
  },
  {
    state: null,
    category: "family",
    title: "SMART Recovery Family & Friends",
    description: "Mutual-support meetings and tools for family and friends, based on the CRAFT approach.",
    url: "https://smartrecovery.org/family/",
    source: "SMART Recovery"
  },
  {
    state: null,
    category: "family",
    title: "Find WIC near you",
    description: "USDA locator for the local WIC clinic serving pregnant women, infants, and children under 5.",
    url: "https://www.fna.usda.gov/wic/locator",
    source: "USDA"
  },
  {
    state: null,
    category: "family",
    title: "Head Start center locator",
    description: "Federal locator for Head Start and Early Head Start programs by ZIP code, city, or state.",
    url: "https://headstart.gov/center-locator",
    source: "HeadStart.gov"
  },
  {
    state: null,
    category: "family",
    title: "988 Suicide & Crisis Lifeline",
    description: "24/7 crisis line for suicide, mental health, and substance use. Call or text 988, or chat on this site.",
    url: "https://988lifeline.org/",
    source: "988 Lifeline"
  },
  {
    state: "PA",
    category: "family",
    title: "Child Care Works",
    description: "Pennsylvania’s child care subsidy. Local Early Learning Resource Centers take applications and can pay part of the cost.",
    url: "https://www.pa.gov/agencies/dhs/resources/early-learning-child-care/child-care-works",
    source: "Pennsylvania DHS"
  },
  {
    state: "PA",
    category: "family",
    title: "Early Learning Resource Centers",
    description: "Directory of the Early Learning Resource Center for each Pennsylvania county, for child care referrals and Child Care Works.",
    url: "https://www.pa.gov/agencies/dhs/resources/early-learning-child-care/elrc",
    source: "Pennsylvania DHS"
  },
  {
    state: "PA",
    category: "family",
    title: "Pennsylvania WIC",
    description: "Nutrition help, breastfeeding support, and food benefits for pregnant women, infants, and young children. Hotline 1-800-942-9467.",
    url: "https://www.pa.gov/agencies/health/programs/maternal-health-and-infant-care/wic",
    source: "Pennsylvania Department of Health"
  },
  {
    state: "PA",
    category: "family",
    title: "Office of Children, Youth and Families",
    description: "State office that oversees county children-and-youth agencies, child abuse services, and in-home family support.",
    url: "https://www.pa.gov/agencies/dhs/departments-offices/ocyf-info",
    source: "Pennsylvania DHS"
  },
  {
    state: "PA",
    category: "family",
    title: "DDAP Family Learning Series",
    description: "Short videos for families supporting someone with a substance use problem, including boundaries, children, and what recovery can look like.",
    url: "https://www.pa.gov/agencies/ddap/treatment-and-support/family-learning-series",
    source: "Pennsylvania DDAP"
  },
  {
    state: "MD",
    category: "family",
    title: "Child Care Scholarship",
    description: "Maryland’s subsidy that helps eligible families pay for child care while they work, train, or go to school.",
    url: "https://marylandchild.org/child-care-scholarship/",
    source: "Maryland State Department of Education"
  },
  {
    state: "MD",
    category: "family",
    title: "Maryland WIC",
    description: "WIC clinics for nutrition benefits and breastfeeding support. Statewide line 1-800-242-4942.",
    url: "https://health.maryland.gov/phpa/wic/Pages/home.aspx",
    source: "Maryland Department of Health"
  },
  {
    state: "MD",
    category: "family",
    title: "Local departments of social services",
    description: "County and Baltimore City offices for child welfare, cash assistance, and other family services.",
    url: "https://dhs.maryland.gov/local-offices/",
    source: "Maryland Department of Human Services"
  },
  {
    state: "DE",
    category: "family",
    title: "Purchase of Care",
    description: "Delaware’s child care subsidy for early learning and after-school care for eligible families.",
    url: "https://dhss.delaware.gov/dss/division-of-social-services/child-care-assistance/",
    source: "Delaware Division of Social Services"
  },
  {
    state: "DE",
    category: "family",
    title: "Delaware WIC",
    description: "WIC clinics for food benefits, nutrition education, and breastfeeding support.",
    url: "https://dhss.delaware.gov/dph/homepage/about/sections/imimep/imhome/dhmic/wic/",
    source: "Delaware Division of Public Health"
  },
  {
    state: "DE",
    category: "family",
    title: "Division of Family Services",
    description: "Delaware’s child welfare agency, for abuse reports, foster care, and family support.",
    url: "https://kids.delaware.gov/family-services/",
    source: "Delaware DSCYF"
  },
  {
    state: "NJ",
    category: "family",
    title: "Child Care Assistance Program",
    description: "New Jersey’s subsidy for eligible families who are working, in school, or in job training.",
    url: "https://www.childcarenj.gov/parents/ccap",
    source: "New Jersey Department of Human Services"
  },
  {
    state: "NJ",
    category: "family",
    title: "New Jersey WIC",
    description: "Food benefits and nutrition support for pregnant women, infants, and children under 5.",
    url: "https://www.nj.gov/health/fhs/wic/",
    source: "New Jersey Department of Health"
  },
  {
    state: "NJ",
    category: "family",
    title: "Department of Children and Families",
    description: "State agency for child protection, children’s behavioral health, and family services.",
    url: "https://www.nj.gov/dcf/",
    source: "New Jersey DCF"
  },
  {
    state: null,
    category: "veterans",
    title: "VA.gov",
    description: "U.S. Department of Veterans Affairs home for benefits, health care, and how to reach VA.",
    url: "https://www.va.gov/",
    source: "U.S. Department of Veterans Affairs"
  },
  {
    state: null,
    category: "veterans",
    title: "Vet Center locator",
    description: "Find a VA Vet Center for readjustment counseling for veterans, service members, and their families.",
    url: "https://www.va.gov/find-locations/?facilityType=vet_center",
    source: "U.S. Department of Veterans Affairs"
  },
  {
    state: null,
    category: "veterans",
    title: "Veterans Crisis Line",
    description: "24/7 crisis line for veterans and their families. Call 988 and press 1, text 838255, or chat here.",
    url: "https://www.veteranscrisisline.net/",
    source: "Veterans Crisis Line"
  },
  {
    state: null,
    category: "veterans",
    title: "VA homeless programs",
    description: "VA programs for veterans who are homeless or at risk of losing their housing.",
    url: "https://www.va.gov/homeless/",
    source: "U.S. Department of Veterans Affairs"
  },
  {
    state: null,
    category: "veterans",
    title: "HUD-VASH",
    description: "Housing vouchers and case management for veterans who are experiencing homelessness.",
    url: "https://department.va.gov/homeless/hud-vash/",
    source: "U.S. Department of Veterans Affairs"
  },
  {
    state: null,
    category: "veterans",
    title: "Supportive Services for Veteran Families",
    description: "Short-term help so veterans and their families can stay housed or move into housing.",
    url: "https://department.va.gov/homeless/supportive-services-for-veteran-families/",
    source: "U.S. Department of Veterans Affairs"
  },
  {
    state: null,
    category: "veterans",
    title: "Vets4Warriors",
    description: "24/7 peer support line staffed by veterans, for service members, veterans, and their families.",
    url: "https://www.vets4warriors.com/",
    source: "Vets4Warriors"
  },
  {
    state: "PA",
    category: "veterans",
    title: "Department of Military and Veterans Affairs",
    description: "Pennsylvania’s state agency for veterans benefits and programs.",
    url: "https://www.pa.gov/agencies/dmva",
    source: "Pennsylvania DMVA"
  },
  {
    state: "PA",
    category: "veterans",
    title: "County directors of veterans affairs",
    description: "Directory of each county’s veterans affairs director, who helps file benefits claims and does not charge for it.",
    url: "https://www.pa.gov/agencies/dmva/pennsylvania-veterans/county-director-of-veterans-affairs",
    source: "Pennsylvania DMVA"
  },
  {
    state: "MD",
    category: "veterans",
    title: "Department of Veterans and Military Families",
    description: "Maryland’s state agency for veterans benefits assistance and services for veterans and families.",
    url: "https://veterans.maryland.gov/",
    source: "Maryland DVMF"
  },
  {
    state: "MD",
    category: "veterans",
    title: "Maryland’s Commitment to Veterans",
    description: "Peer support and care coordination for Maryland service members, veterans, and families. Call 1-877-770-4801, any time.",
    url: "https://health.maryland.gov/bha/veterans/Pages/Home.aspx",
    source: "Maryland Behavioral Health Administration"
  },
  {
    state: "DE",
    category: "veterans",
    title: "Office of Veterans Services",
    description: "Delaware’s office for veterans benefits help, outreach, and assistance for veterans and their families.",
    url: "https://vets.delaware.gov/",
    source: "Delaware Office of Veterans Services"
  },
  {
    state: "NJ",
    category: "veterans",
    title: "DMAVA veterans affairs",
    description: "New Jersey Department of Military and Veterans Affairs page for veterans programs and services.",
    url: "https://www.nj.gov/military/veterans/",
    source: "New Jersey DMAVA"
  },
  {
    state: "NJ",
    category: "veterans",
    title: "Department of Veterans Affairs",
    description: "New Jersey’s department for state veterans benefits and services.",
    url: "https://www.nj.gov/dva/",
    source: "New Jersey Department of Veterans Affairs"
  },
  {
    state: "NJ",
    category: "veterans",
    title: "Veterans service offices",
    description: "Accredited veterans service offices in every New Jersey county, for help filing benefits claims.",
    url: "https://www.nj.gov/dva/veterans/services/vso/",
    source: "New Jersey Department of Veterans Affairs"
  }
];
