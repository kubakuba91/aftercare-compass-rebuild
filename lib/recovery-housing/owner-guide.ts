import type { ResourceLink, StateResource } from "./types";

export const ownerGuideTabs = [
  { id: "all", label: "All" },
  { id: "licensing", label: "Licensing & Certification" },
  { id: "standards", label: "NARR & Standards" },
  { id: "zoning", label: "Zoning" },
  { id: "funding", label: "Funding" },
  { id: "templates", label: "Templates & Policies" },
  { id: "faq", label: "FAQ" }
] as const;

export type OwnerGuideTab = (typeof ownerGuideTabs)[number]["id"];

export function isOwnerGuideTab(value: string | null | undefined): value is OwnerGuideTab {
  return ownerGuideTabs.some((tab) => tab.id === value);
}

/** `licensing-funding` was the combined resources tab. It opens Licensing here too. */
export function normalizeOwnerGuideTab(value: string | null | undefined): OwnerGuideTab {
  if (value === "licensing-funding") return "licensing";
  return isOwnerGuideTab(value) ? value : "all";
}

export function ownerGuideHref(state: string, tab: OwnerGuideTab, query: string, options?: { explicitAll?: boolean }) {
  const params = new URLSearchParams();
  if (state && state !== "all") params.set("state", state);
  else if (options?.explicitAll) params.set("state", "all");
  if (tab !== "all") params.set("tab", tab);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/resources/recovery-house-owners?${search}` : "/resources/recovery-house-owners";
}

export function includesQuery(text: string, query: string) {
  const q = query.trim().toLowerCase();
  return !q || text.toLowerCase().includes(q);
}

export function stateSearchText(state: StateResource) {
  return [
    state.name,
    state.code,
    state.oversightLabel,
    state.body.name,
    state.narrNote,
    ...state.summary.flatMap((item) => [item.text, item.source]),
    ...(state.steps ?? []),
    ...state.links.flatMap((link) => [link.title, link.description, link.source]),
    state.local?.label,
    state.local?.description,
    ...(state.local?.links ?? []).flatMap((link) => [link.title, link.description, link.source]),
    state.narrAffiliate?.title,
    state.narrAffiliate?.description,
    state.narrAffiliate?.source,
    ...(state.funding ?? []).flatMap((item) => [item.text, item.source]),
    ...(state.fundingLinks ?? []).flatMap((link) => [link.title, link.description, link.source]),
    ...(state.faq ?? []).flatMap((item) => [item.question, item.answer, item.source]),
    ...(state.gaps ?? [])
  ]
    .filter(Boolean)
    .join(" ");
}

export function linkSearchText(link: ResourceLink) {
  return [link.title, link.description, link.source].filter(Boolean).join(" ");
}
