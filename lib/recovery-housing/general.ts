import type { FaqItem, ResourceLink } from "./types";

// State-neutral content for the recovery house owner resources page.
// Template outlines are starting points only, not legal documents.

export type TemplateOutline = {
  title: string;
  intro: string;
  items: { text: string; paReference?: string }[];
};

export const templateOutlines: TemplateOutline[] = [
  {
    title: "House rules",
    intro: "What residents agree to day to day. Keep it short, specific, and posted.",
    items: [
      { text: "Alcohol- and drug-free home, and what happens if someone uses.", paReference: "§ 717.28(2)" },
      { text: "Taking part in treatment, mutual support groups, or other recovery supports.", paReference: "§ 717.28(1)" },
      { text: "Sign-out and expected return times, and how they are recorded.", paReference: "§ 717.22(b)(2)(i)" },
      { text: "Medication storage (controlled substances locked) and no sharing prescriptions.", paReference: "§ 717.24" },
      { text: "Smoking only in designated outdoor areas; no portable space heaters.", paReference: "§ 717.29(b), (g)" },
      { text: "Guests, quiet hours, chores, shared spaces, and being a good neighbor." },
      { text: "How residents raise a complaint, including with the state agency.", paReference: "§ 717.26" },
      { text: "Where emergency procedures and house manager contacts are posted.", paReference: "§ 717.22(b)(2)(v)" }
    ]
  },
  {
    title: "Resident agreement checklist",
    intro: "What to cover and have signed when someone moves in.",
    items: [
      { text: "Criteria for starting, completing, and ending residency.", paReference: "§ 717.22(a), (b)(1)" },
      { text: "Orientation: house rules, fee schedule and any lease, supports offered, and financial policies.", paReference: "§ 717.22(b)(2)" },
      { text: "Basic personal data, medical information the resident chooses to share, and an emergency contact.", paReference: "§ 717.22(b)(3)" },
      { text: "Consent to residency and written acknowledgment of resident rights.", paReference: "§§ 717.19(b), 717.22(b)(4)" },
      { text: "When and how staff may contact the emergency contact, and how the resident can revoke consent.", paReference: "§§ 717.22(b)(5), 717.27" },
      { text: "Deposits and fees in writing, receipts, and how deposits are returned.", paReference: "§ 717.25(a)" },
      { text: "No signing over benefits or paychecks, and no lending, borrowing, or buying and selling property with residents.", paReference: "§ 717.25(b)" },
      { text: "A separate signed agreement if you help a resident manage money.", paReference: "§ 717.25(e)" }
    ]
  },
  {
    title: "Drug testing and relapse policy",
    intro: "How you check for use, and how you respond with safety and recovery in mind.",
    items: [
      { text: "What substances are prohibited, and how prescribed medications are handled.", paReference: "§§ 717.3, 717.28" },
      { text: "Residents’ right to choose their own treatment provider, including medication for opioid use disorder.", paReference: "§ 717.19(a)(6)" },
      { text: "Testing method, frequency, who collects, and how results are recorded and kept private." },
      { text: "What happens after a positive test or return to use: consequences, a recovery plan, and connections to treatment." },
      { text: "Written notice with the reason and timeframe before ending residency, and a chance to ask for reconsideration.", paReference: "§ 717.23" },
      { text: "Contacting the emergency contact if a resident leaves or doesn’t return as expected.", paReference: "§ 717.27(b)" },
      { text: "Logging drug use on the premises as an unusual incident.", paReference: "§ 717.31(a)(2)" },
      { text: "A separate policy for staff and volunteer use and relapse.", paReference: "§ 717.17(b)(5)–(6)" }
    ]
  }
];

/** NARR Standard 3.0 outline: four domains and ten principles (A–J), as published by PARR. */
export const narrChecklist: { domain: string; principles: string[] }[] = [
  {
    domain: "Administrative and operational",
    principles: [
      "Operate with integrity",
      "Uphold residents’ rights",
      "Create a culture of empowerment where residents take part in governance and leadership",
      "Develop staff abilities to apply the Social Model"
    ]
  },
  { domain: "Physical environment", principles: ["Provide a home-like environment", "Promote a safe and healthy environment"] },
  {
    domain: "Recovery support",
    principles: [
      "Facilitate active recovery and recovery community engagement",
      "Model prosocial behaviors and relationship skills",
      "Cultivate residents’ sense of belonging and responsibility for community"
    ]
  },
  { domain: "Good neighbor", principles: ["Be a good neighbor"] }
];

export const standardsLinks: ResourceLink[] = [
  { title: "The NARR Standard, levels, and Code of Ethics", href: "https://narronline.org/standards/", source: "narronline.org · NARR" },
  { title: "NARR Standard 3.0 outline", href: "https://www.parronline.org/narr-standards", source: "parronline.org · PARR" },
  { title: "PARR standards: certification vs. licensing", href: "https://www.parronline.org/standards", source: "parronline.org · PARR" },
  { title: "Find your NARR state affiliate", href: "https://narronline.org/affiliates/", source: "narronline.org · NARR" }
];

export const generalFaq: FaqItem[] = [
  {
    question: "Is certification the same as a state license?",
    answer:
      "Not necessarily. NARR affiliates certify homes to a voluntary national standard. Some states also license or certify recovery residences, or tie referrals and public funding to certification. Pick your state above to see what applies.",
    source: "NARR; PARR; state agency pages"
  },
  {
    question: "What are NARR levels?",
    answer:
      "NARR describes four levels (types): Level I peer-run, Level II monitored, Level III supervised, and Level IV clinical. They differ by staffing, governance, and the recovery support services offered.",
    source: "NARR — Standards"
  },
  {
    question: "Who do I ask about zoning and occupancy?",
    answer: "Your township, borough, or city zoning officer and building code official. Rules vary by municipality, so confirm before you sign a lease or buy.",
    source: "General guidance"
  }
];
