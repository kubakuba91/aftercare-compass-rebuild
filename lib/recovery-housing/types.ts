/**
 * Structured, per-state recovery house owner resources.
 *
 * Rules for adding or editing a state:
 * - Every `href` must be checked live (HTTP 200) against an official or reputable source before merging.
 * - Every factual statement should be traceable to one of the state's `links` (use `source` to name it).
 * - If something can't be verified, leave it out and add it to `gaps` instead of guessing.
 */
export type ResourceLink = {
  title: string;
  href: string;
  /** Short publisher label, e.g. "pa.gov · DDAP". */
  source: string;
  description?: string;
};

export type SourcedText = {
  text: string;
  /** Name of the source the statement comes from (should match a link's title or source). */
  source: string;
};

export type FaqItem = {
  question: string;
  answer: string;
  source: string;
};

export type StateOversight =
  | "required-license"
  | "required-certification"
  | "voluntary-certification-with-funding-or-referral-limits"
  | "voluntary-certification"
  | "registration-plus-voluntary-certification"
  | "no-state-license"
  | "not-verified";

export type StateResource = {
  code: string;
  name: string;
  /** One-line label shown under the state name. */
  oversightLabel: string;
  oversight: StateOversight;
  /** Agency or body that licenses, certifies, or lists recovery residences. */
  body: { name: string; href?: string };
  summary: SourcedText[];
  steps?: string[];
  links: ResourceLink[];
  /** County or regional offices that fund or coordinate substance use services (PA SCAs and equivalents). */
  local?: { label: string; description: string; links: ResourceLink[] };
  narrAffiliate?: ResourceLink;
  funding?: SourcedText[];
  fundingLinks?: ResourceLink[];
  faq?: FaqItem[];
  /** Items we could not verify on an official or reputable source. Not shown as facts. */
  gaps?: string[];
};
