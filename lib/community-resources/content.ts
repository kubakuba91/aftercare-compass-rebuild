import type { ResourceLink } from "@/lib/recovery-housing/types";

// Community resources for people leaving treatment. Links checked live on 2026-11-23.
// Official agency, transit authority, or established 211 / United Way pages only.

export type CommunityGroup = {
  title: string;
  links: ResourceLink[];
};

export type CommunityPlace = {
  name: string;
  summary: string;
  links: ResourceLink[];
};

export type CommunityState = {
  code: string;
  name: string;
  summary: string;
  groups: CommunityGroup[];
};

export const crisisLinks: ResourceLink[] = [
  {
    title: "DDAP Get Help Now",
    href: "https://www.pa.gov/agencies/ddap/treatment-and-support/get-help-now-campaign",
    source: "pa.gov · DDAP",
    description:
      "Free, confidential help finding substance use treatment or funding, 24/7. Call 1-800-662-HELP (4357) or text 717-216-0905. Chat and text are answered by a person."
  },
  {
    title: "988 Suicide & Crisis Lifeline",
    href: "https://www.samhsa.gov/mental-health/988",
    source: "samhsa.gov",
    description: "Call or text 988, or use chat through the lifeline, for 24/7 suicide, mental health, and substance-use crisis support."
  }
];

export const nationalLinks: ResourceLink[] = [
  {
    title: "211",
    href: "https://211.org/",
    source: "211.org",
    description: "Call 211 to reach the local information and referral line for housing, food, utilities, and other help."
  },
  {
    title: "HUD Find Shelter",
    href: "https://www.hud.gov/findshelter",
    source: "hud.gov",
    description: "U.S. Department of Housing and Urban Development search for nearby shelter, housing, and related help."
  },
  {
    title: "SNAP (food assistance)",
    href: "https://www.fna.usda.gov/snap",
    source: "usda.gov · Food and Nutrition Administration",
    description: "Federal Supplemental Nutrition Assistance Program overview. Apply through your state, not this page."
  }
];

export const pennsylvaniaGroups: CommunityGroup[] = [
  {
    title: "Housing",
    links: [
      {
        title: "PA 211",
        href: "https://www.pa211.org/",
        source: "pa211.org",
        description: "Free, confidential help 24/7. Dial 211 or text your ZIP code to 898-211 to find housing, food, and other local services."
      },
      {
        title: "PHFA renter assistance",
        href: "https://www.phfa.org/renters/",
        source: "phfa.org · Pennsylvania Housing Finance Agency",
        description: "State housing finance agency page for renters, including help finding affordable rental housing."
      }
    ]
  },
  {
    title: "Jobs",
    links: [
      {
        title: "Find jobs with PA CareerLink",
        href: "https://www.pa.gov/services/dli/find-jobs-with-pa-careerlink-",
        source: "pa.gov · Department of Labor & Industry",
        description: "What PA CareerLink offers job seekers, and how to find a local office."
      },
      {
        title: "PA CareerLink job search",
        href: "https://www.pacareerlink.pa.gov/jponline",
        source: "pacareerlink.pa.gov",
        description: "The state’s job-matching system. Create a free account to search and apply."
      }
    ]
  },
  {
    title: "Food",
    links: [
      {
        title: "Apply for SNAP",
        href: "https://www.pa.gov/services/dhs/apply-for-the-supplemental-nutrition-assistance-program-snap",
        source: "pa.gov · Department of Human Services",
        description: "Supplemental Nutrition Assistance Program (food benefits). Questions: DHS HelpLine, 1-800-692-7462."
      },
      {
        title: "WIC",
        href: "https://www.pa.gov/agencies/health/programs/maternal-health-and-infant-care/wic",
        source: "pa.gov · Department of Health",
        description: "Nutrition help for pregnant women, caregivers, infants, and children under 5. Hotline: 1-800-WIC-WINS (1-800-942-9467)."
      },
      {
        title: "County Assistance Offices",
        href: "https://www.pa.gov/agencies/dhs/contact/cao-information",
        source: "pa.gov · Department of Human Services",
        description: "Directory of county assistance offices, including Dauphin (Harrisburg), Lancaster, York, and Berks (Reading), for SNAP, cash, and medical assistance."
      },
      {
        title: "COMPASS",
        href: "https://www.compass.dhs.pa.gov/home/#/",
        source: "compass.dhs.pa.gov · DHS",
        description: "Apply for or renew Pennsylvania benefits online, including SNAP and medical assistance."
      }
    ]
  },
  {
    title: "Transit",
    links: [
      {
        title: "PennDOT",
        href: "https://www.pa.gov/agencies/penndot",
        source: "pa.gov · Department of Transportation",
        description: "Pennsylvania Department of Transportation. Local bus service is run by regional transit authorities."
      },
      {
        title: "rabbittransit",
        href: "https://www.rabbittransit.org/services/",
        source: "rabbittransit.org",
        description: "Fixed-route and shared-ride service in Harrisburg’s Capital Region and in York, plus commuter routes between them."
      },
      {
        title: "South Central Transit Authority",
        href: "https://www.sctapa.com/",
        source: "sctapa.com",
        description: "Operates Red Rose Transit in Lancaster and BARTA in Reading."
      }
    ]
  }
];

export const centralPennsylvania: CommunityPlace[] = [
  {
    name: "Harrisburg",
    summary: "Dauphin County and the Capital Region bus system.",
    links: [
      {
        title: "rabbittransit Capital Region routes",
        href: "https://www.rabbittransit.org/services/",
        source: "rabbittransit.org",
        description: "Bus routes serving Harrisburg, Dauphin County, and Cumberland County, plus shared-ride service."
      },
      {
        title: "Harrisburg Housing Authority",
        href: "https://harrisburghousing.org/",
        source: "harrisburghousing.org",
        description: "Public housing authority for the City of Harrisburg."
      },
      {
        title: "Dauphin County",
        href: "https://www.dauphincounty.gov/",
        source: "dauphincounty.gov",
        description: "County government site for human services and other county offices. The Dauphin County Assistance Office is listed on the statewide CAO directory."
      }
    ]
  },
  {
    name: "Lancaster",
    summary: "Lancaster County bus service and the county housing authority.",
    links: [
      {
        title: "Red Rose Transit",
        href: "https://www.redrosetransit.com/",
        source: "redrosetransit.com · South Central Transit Authority",
        description: "Lancaster County bus routes and rider information."
      },
      {
        title: "Lancaster County Housing & Redevelopment Authorities",
        href: "https://lchra.com/",
        source: "lchra.com",
        description: "County housing authority and redevelopment programs."
      },
      {
        title: "Lancaster County",
        href: "https://www.lancastercountypa.gov/",
        source: "lancastercountypa.gov",
        description: "County government site. The Lancaster County Assistance Office is listed on the statewide CAO directory."
      }
    ]
  },
  {
    name: "York",
    summary: "York bus service and county government.",
    links: [
      {
        title: "rabbittransit York routes",
        href: "https://www.rabbittransit.org/services/",
        source: "rabbittransit.org",
        description: "Fixed-route buses in the City of York and surrounding suburbs, plus shared-ride service."
      },
      {
        title: "York County",
        href: "https://yorkcountypa.gov/",
        source: "yorkcountypa.gov",
        description: "County government site. The York County Assistance Office is listed on the statewide CAO directory."
      }
    ]
  },
  {
    name: "Reading",
    summary: "Berks County bus service and county government.",
    links: [
      {
        title: "BARTA",
        href: "https://www.bartabus.com/",
        source: "bartabus.com · South Central Transit Authority",
        description: "Berks Area Regional Transportation Authority buses in Reading and Berks County."
      },
      {
        title: "Berks County",
        href: "https://www.berkspa.gov/",
        source: "berkspa.gov",
        description: "County government site. The Berks County Assistance Office in Reading is listed on the statewide CAO directory."
      }
    ]
  }
];

export const otherStates: CommunityState[] = [
  {
    code: "CT",
    name: "Connecticut",
    summary: "Statewide help for housing, work, food, and buses.",
    groups: [
      {
        title: "Help finding services",
        links: [
          {
            title: "211 Connecticut",
            href: "https://www.211ct.org/",
            source: "211ct.org",
            description: "Call 211 for local housing, food, and other community resources."
          }
        ]
      },
      {
        title: "Housing",
        links: [
          {
            title: "Department of Housing",
            href: "https://portal.ct.gov/doh",
            source: "portal.ct.gov · DOH",
            description: "Connecticut Department of Housing."
          }
        ]
      },
      {
        title: "Jobs",
        links: [
          {
            title: "CTHires",
            href: "https://www.cthires.com/",
            source: "cthires.com",
            description: "Connecticut’s job-search system."
          }
        ]
      },
      {
        title: "Food",
        links: [
          {
            title: "SNAP",
            href: "https://portal.ct.gov/dss/snap/supplemental-nutrition-assistance-program---snap",
            source: "portal.ct.gov · Department of Social Services",
            description: "Connecticut food assistance through the Department of Social Services."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "CTtransit",
            href: "https://www.cttransit.com/",
            source: "cttransit.com",
            description: "Statewide bus system. Schedules and rider alerts are on the site."
          }
        ]
      }
    ]
  },
  {
    code: "DE",
    name: "Delaware",
    summary: "Statewide benefits, jobs, housing, and DART buses.",
    groups: [
      {
        title: "Help finding services",
        links: [
          {
            title: "Delaware 211",
            href: "https://delaware211.org/",
            source: "delaware211.org",
            description: "Free, confidential hotline for local resources."
          }
        ]
      },
      {
        title: "Housing",
        links: [
          {
            title: "Delaware State Housing Authority",
            href: "https://www.destatehousing.com/",
            source: "destatehousing.com",
            description: "State housing programs for renters and people looking for a home."
          }
        ]
      },
      {
        title: "Jobs",
        links: [
          {
            title: "Delaware Department of Labor",
            href: "https://labor.delaware.gov/",
            source: "labor.delaware.gov",
            description: "State labor department for job seekers."
          }
        ]
      },
      {
        title: "Food",
        links: [
          {
            title: "Delaware ASSIST",
            href: "https://assist.dhss.delaware.gov/",
            source: "assist.dhss.delaware.gov · DHSS",
            description: "Apply for SNAP and other Delaware public benefits."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "DART First State",
            href: "https://www.dartfirststate.com/",
            source: "dartfirststate.com",
            description: "Delaware’s statewide bus system."
          }
        ]
      }
    ]
  },
  {
    code: "FL",
    name: "Florida",
    summary: "Statewide benefits, jobs, housing finance, and public transit.",
    groups: [
      {
        title: "Housing",
        links: [
          {
            title: "Florida Housing Finance Corporation",
            href: "https://www.floridahousing.org/",
            source: "floridahousing.org",
            description: "State housing finance agency."
          }
        ]
      },
      {
        title: "Jobs",
        links: [
          {
            title: "Employ Florida",
            href: "https://www.employflorida.com/",
            source: "employflorida.com",
            description: "The state’s job-search system."
          }
        ]
      },
      {
        title: "Food",
        links: [
          {
            title: "DCF public benefits",
            href: "https://www.myflfamilies.com/services/public-assistance",
            source: "myflfamilies.com · DCF",
            description: "Department of Children and Families page for public benefits, including food assistance."
          },
          {
            title: "MyACCESS",
            href: "https://myaccess.myflfamilies.com/",
            source: "myaccess.myflfamilies.com · DCF",
            description: "Apply for Florida public benefits online."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "FDOT Public Transit Office",
            href: "https://www.fdot.gov/fdottransit/transitofficehome",
            source: "fdot.gov",
            description: "Florida Department of Transportation public transit office. Local bus systems are listed through the department."
          }
        ]
      }
    ]
  },
  {
    code: "GA",
    name: "Georgia",
    summary: "Statewide food, jobs, transportation, and community affairs.",
    groups: [
      {
        title: "Housing",
        links: [
          {
            title: "Department of Community Affairs",
            href: "https://dca.georgia.gov/",
            source: "dca.georgia.gov",
            description: "Georgia Department of Community Affairs, which administers state housing programs."
          }
        ]
      },
      {
        title: "Jobs",
        links: [
          {
            title: "Georgia Department of Labor",
            href: "https://dol.georgia.gov/",
            source: "dol.georgia.gov",
            description: "State labor department for job seekers."
          }
        ]
      },
      {
        title: "Food",
        links: [
          {
            title: "SNAP",
            href: "https://dfcs.georgia.gov/services/snap",
            source: "dfcs.georgia.gov",
            description: "Georgia food assistance through the Division of Family and Children Services."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "Georgia Department of Transportation",
            href: "https://www.dot.ga.gov/",
            source: "dot.ga.gov",
            description: "State department of transportation."
          }
        ]
      }
    ]
  },
  {
    code: "MD",
    name: "Maryland",
    summary: "Statewide food, jobs, transportation, and housing.",
    groups: [
      {
        title: "Housing",
        links: [
          {
            title: "Department of Housing and Community Development",
            href: "https://dhcd.maryland.gov/",
            source: "dhcd.maryland.gov",
            description: "Maryland housing and community development programs."
          }
        ]
      },
      {
        title: "Jobs",
        links: [
          {
            title: "Maryland Department of Labor",
            href: "https://www.labor.maryland.gov/",
            source: "labor.maryland.gov",
            description: "State labor department for job seekers."
          }
        ]
      },
      {
        title: "Food",
        links: [
          {
            title: "SNAP",
            href: "https://dhs.maryland.gov/supplemental-nutrition-assistance-program/",
            source: "dhs.maryland.gov",
            description: "Maryland Supplemental Nutrition Assistance Program."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "Maryland Department of Transportation",
            href: "https://www.mdot.maryland.gov/",
            source: "mdot.maryland.gov",
            description: "State department of transportation."
          }
        ]
      }
    ]
  },
  {
    code: "MA",
    name: "Massachusetts",
    summary: "Statewide 211. State agency pages for SNAP, jobs, housing, and transit could not be confirmed from this check.",
    groups: [
      {
        title: "Help finding services",
        links: [
          {
            title: "Mass 211",
            href: "https://mass211.org/",
            source: "mass211.org",
            description: "Call 211 for local housing, food, and other community resources."
          }
        ]
      }
    ]
  },
  {
    code: "NJ",
    name: "New Jersey",
    summary: "Statewide 211, SNAP, jobs, NJ Transit, and housing.",
    groups: [
      {
        title: "Help finding services",
        links: [
          {
            title: "NJ 211",
            href: "https://nj211.org/",
            source: "nj211.org",
            description: "Call 211 for local housing, food, and other community resources."
          }
        ]
      },
      {
        title: "Housing",
        links: [
          {
            title: "Department of Community Affairs housing division",
            href: "https://www.nj.gov/dca/divisions/dhcr/",
            source: "nj.gov · DCA",
            description: "Division of Housing and Community Resources."
          }
        ]
      },
      {
        title: "Jobs",
        links: [
          {
            title: "Career services",
            href: "https://www.nj.gov/labor/career-services/",
            source: "nj.gov · Department of Labor",
            description: "New Jersey career services for job seekers."
          }
        ]
      },
      {
        title: "Food",
        links: [
          {
            title: "NJ SNAP",
            href: "https://www.nj.gov/humanservices/njsnap/",
            source: "nj.gov · Department of Human Services",
            description: "New Jersey Supplemental Nutrition Assistance Program."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "NJ Transit",
            href: "https://www.njtransit.com/",
            source: "njtransit.com",
            description: "Statewide bus, rail, and light rail."
          }
        ]
      }
    ]
  },
  {
    code: "NY",
    name: "New York",
    summary: "Statewide career centers and the state department of transportation. A statewide 211 site and SNAP application page were not confirmed.",
    groups: [
      {
        title: "Jobs",
        links: [
          {
            title: "Department of Labor career centers",
            href: "https://dol.ny.gov/career-centers",
            source: "dol.ny.gov",
            description: "Find a New York State career center."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "Department of Transportation",
            href: "https://www.dot.ny.gov/",
            source: "dot.ny.gov",
            description: "New York State Department of Transportation."
          }
        ]
      }
    ]
  },
  {
    code: "NC",
    name: "North Carolina",
    summary: "Statewide 211, food assistance, jobs, transit, and housing finance.",
    groups: [
      {
        title: "Help finding services",
        links: [
          {
            title: "NC 211",
            href: "https://nc211.org/",
            source: "nc211.org",
            description: "Call 211 for local housing, food, and other community resources."
          }
        ]
      },
      {
        title: "Housing",
        links: [
          {
            title: "North Carolina Housing Finance Agency",
            href: "https://www.nchfa.com/",
            source: "nchfa.com",
            description: "State housing finance agency."
          }
        ]
      },
      {
        title: "Jobs",
        links: [
          {
            title: "NCWorks",
            href: "https://www.ncworks.gov/",
            source: "ncworks.gov",
            description: "North Carolina’s job-search system."
          }
        ]
      },
      {
        title: "Food",
        links: [
          {
            title: "Food and Nutrition Services",
            href: "https://www.ncdhhs.gov/divisions/child-and-family-well-being/food-and-nutrition-services-food-stamps",
            source: "ncdhhs.gov",
            description: "North Carolina’s SNAP program (Food and Nutrition Services)."
          },
          {
            title: "ePASS",
            href: "https://epass.nc.gov/",
            source: "epass.nc.gov · NCDHHS",
            description: "Apply for North Carolina benefits online."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "NCDOT Integrated Mobility Division",
            href: "https://www.ncdot.gov/divisions/integrated-mobility/Pages/default.aspx",
            source: "ncdot.gov",
            description: "State public transportation programs. Local bus systems run service in each community."
          }
        ]
      }
    ]
  },
  {
    code: "OH",
    name: "Ohio",
    summary: "Statewide benefits, jobs, transportation, and housing finance.",
    groups: [
      {
        title: "Housing",
        links: [
          {
            title: "Ohio Housing Finance Agency",
            href: "https://ohiohome.org/",
            source: "ohiohome.org",
            description: "State housing finance agency."
          }
        ]
      },
      {
        title: "Jobs",
        links: [
          {
            title: "OhioMeansJobs",
            href: "https://ohiomeansjobs.ohio.gov/",
            source: "ohiomeansjobs.ohio.gov",
            description: "Ohio’s job-search system."
          }
        ]
      },
      {
        title: "Food",
        links: [
          {
            title: "Ohio Benefits",
            href: "https://benefits.ohio.gov/",
            source: "benefits.ohio.gov",
            description: "Apply for SNAP and other Ohio public benefits."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "Ohio Department of Transportation",
            href: "https://www.transportation.ohio.gov/",
            source: "transportation.ohio.gov",
            description: "State department of transportation."
          }
        ]
      }
    ]
  },
  {
    code: "SC",
    name: "South Carolina",
    summary: "Statewide 211, SNAP, jobs, transportation, and housing.",
    groups: [
      {
        title: "Help finding services",
        links: [
          {
            title: "SC 211",
            href: "https://www.sc211.org/",
            source: "sc211.org",
            description: "Call 211 for local housing, food, and other community resources."
          }
        ]
      },
      {
        title: "Housing",
        links: [
          {
            title: "SC Housing",
            href: "https://www.schousing.sc.gov/",
            source: "schousing.sc.gov",
            description: "South Carolina housing programs."
          }
        ]
      },
      {
        title: "Jobs",
        links: [
          {
            title: "SC Works",
            href: "https://www.scworks.org/",
            source: "scworks.org",
            description: "South Carolina’s job-search system."
          }
        ]
      },
      {
        title: "Food",
        links: [
          {
            title: "SNAP",
            href: "https://dss.sc.gov/assistance-programs/snap/",
            source: "dss.sc.gov",
            description: "South Carolina Supplemental Nutrition Assistance Program."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "South Carolina Department of Transportation",
            href: "https://www.scdot.org/",
            source: "scdot.org",
            description: "State department of transportation."
          }
        ]
      }
    ]
  },
  {
    code: "TN",
    name: "Tennessee",
    summary: "Statewide jobs, transportation, and housing finance. A SNAP page and a secure statewide 211 page were not confirmed.",
    groups: [
      {
        title: "Housing",
        links: [
          {
            title: "Tennessee Housing Development Agency",
            href: "https://thda.org/",
            source: "thda.org",
            description: "State housing development agency."
          }
        ]
      },
      {
        title: "Jobs",
        links: [
          {
            title: "Jobs4TN",
            href: "https://www.tn.gov/jobs4tn",
            source: "tn.gov",
            description: "Tennessee’s job-search system."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "Tennessee Department of Transportation",
            href: "https://www.tn.gov/tdot.html",
            source: "tn.gov · TDOT",
            description: "State department of transportation."
          }
        ]
      }
    ]
  },
  {
    code: "VA",
    name: "Virginia",
    summary: "Statewide benefits, jobs, rail and public transportation, and housing.",
    groups: [
      {
        title: "Housing",
        links: [
          {
            title: "Department of Housing and Community Development",
            href: "https://www.dhcd.virginia.gov/",
            source: "dhcd.virginia.gov",
            description: "Virginia housing and community development programs."
          }
        ]
      },
      {
        title: "Jobs",
        links: [
          {
            title: "Virginia Career Works",
            href: "https://www.vawc.virginia.gov/",
            source: "vawc.virginia.gov",
            description: "The state’s job-search system."
          }
        ]
      },
      {
        title: "Food",
        links: [
          {
            title: "CommonHelp",
            href: "https://www.commonhelp.virginia.gov/",
            source: "commonhelp.virginia.gov · VDSS",
            description: "Apply for SNAP and other Virginia public benefits."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "Department of Rail and Public Transportation",
            href: "https://drpt.virginia.gov/",
            source: "drpt.virginia.gov",
            description: "State rail and public transportation department."
          }
        ]
      }
    ]
  },
  {
    code: "WV",
    name: "West Virginia",
    summary: "Statewide 211, the PATH benefits portal, and the department of transportation.",
    groups: [
      {
        title: "Help finding services",
        links: [
          {
            title: "West Virginia 211",
            href: "https://wv211.org/",
            source: "wv211.org",
            description: "Call 211 for local housing, food, and other community resources."
          }
        ]
      },
      {
        title: "Food",
        links: [
          {
            title: "WV PATH",
            href: "https://www.wvpath.wv.gov/",
            source: "wvpath.wv.gov",
            description: "West Virginia’s online portal for SNAP and other public benefits."
          }
        ]
      },
      {
        title: "Transit",
        links: [
          {
            title: "Department of Transportation",
            href: "https://transportation.wv.gov/",
            source: "transportation.wv.gov",
            description: "West Virginia Department of Transportation."
          }
        ]
      }
    ]
  }
];
