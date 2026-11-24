import {
  centralPennsylvania,
  crisisLinks,
  nationalLinks,
  otherStates,
  pennsylvaniaGroups,
  type CommunityGroup,
  type CommunityPlace
} from "@/lib/community-resources/content";
import { federalOwnerFunding, stateOwnerFunding } from "@/lib/recovery-housing/funding";
import { standardsLinks } from "@/lib/recovery-housing/general";
import { stateResources } from "@/lib/recovery-housing/states";
import type { ResourceLink } from "@/lib/recovery-housing/types";

export const resourceCategories = [
  { id: "all", label: "All" },
  { id: "housing", label: "Housing" },
  { id: "food", label: "Food" },
  { id: "shelter", label: "Shelter" },
  { id: "employment", label: "Employment" },
  { id: "transit", label: "Transit" },
  { id: "licensing", label: "Licensing & Funding" },
  { id: "help", label: "Help finding services" }
] as const;

export type ResourceCategory = (typeof resourceCategories)[number]["id"];

export type CatalogEntry = {
  id: string;
  /** Null means the resource applies in every state. */
  state: string | null;
  stateName: string | null;
  area?: string;
  category: Exclude<ResourceCategory, "all">;
  title: string;
  description: string;
  url: string;
  source: string;
  /** Extra words used only by search, such as a place introduction. */
  context?: string;
};

const groupCategory: Record<string, CatalogEntry["category"]> = {
  Housing: "housing",
  Jobs: "employment",
  Food: "food",
  Transit: "transit",
  "Help finding services": "help"
};

const stateNameByCode = new Map(stateResources.map((state) => [state.code, state.name]));

function classifyPlace(link: ResourceLink): CatalogEntry["category"] {
  const hay = `${link.title} ${link.href}`.toLowerCase();
  if (hay.includes("shelter")) return "shelter";
  if (/transit|rabbit|red rose|barta|ride on|wmata|\bmta\b|dart|\bbus\b/.test(hay)) return "transit";
  if (/career|job|employ|works/.test(hay)) return "employment";
  if (/housing|redevelopment/.test(hay)) return "housing";
  if (/\bsnap\b|\bwic\b|nutrition|\bfood\b/.test(hay)) return "food";
  return "help";
}

function fundingState(link: ResourceLink): string | null {
  const hay = `${link.title} ${link.source} ${link.href}`.toLowerCase();
  if (hay.includes("ddap") || hay.includes("pennsylvania")) return "PA";
  if (hay.includes("delaware") || hay.includes("dsamh")) return "DE";
  if (hay.includes("maryland")) return "MD";
  if (hay.includes("new jersey") || hay.includes("nj.gov")) return "NJ";
  if (hay.includes("oasas") || hay.includes("new york")) return "NY";
  if (hay.includes("north carolina") || hay.includes("ncdhhs")) return "NC";
  if (hay.includes("ohio")) return "OH";
  if (hay.includes("tennessee") || hay.includes("tdmhsas")) return "TN";
  if (hay.includes("virginia") || hay.includes("dbhds")) return "VA";
  return null;
}

const entries: CatalogEntry[] = [];
const seen = new Set<string>();
let nextId = 0;

function add(entry: Omit<CatalogEntry, "id" | "stateName"> & { state: string | null }) {
  const key = `${entry.state ?? "*"}|${entry.category}|${entry.url}`;
  if (seen.has(key)) return;
  seen.add(key);
  const stateName = entry.state ? stateNameByCode.get(entry.state) ?? entry.state : null;
  entries.push({ ...entry, id: `resource-${nextId++}`, stateName });
}

function addLink(
  link: ResourceLink,
  state: string | null,
  category: CatalogEntry["category"],
  extra?: { area?: string; context?: string }
) {
  add({
    state,
    category,
    title: link.title,
    description: link.description?.trim() || link.source,
    url: link.href,
    source: link.source,
    area: extra?.area,
    context: extra?.context
  });
}

function categoryForGroup(groupTitle: string, link: ResourceLink): CatalogEntry["category"] {
  if (/211/i.test(`${link.title} ${link.href}`)) return "help";
  return groupCategory[groupTitle] ?? "help";
}

function addGroups(groups: CommunityGroup[], state: string, area?: string, context?: string) {
  for (const group of groups) {
    for (const link of group.links) addLink(link, state, categoryForGroup(group.title, link), { area, context });
  }
}

function addPlaces(places: CommunityPlace[], state: string) {
  for (const place of places) {
    for (const link of place.links) {
      addLink(link, state, classifyPlace(link), { area: place.name, context: place.summary });
    }
  }
}

for (const link of crisisLinks) {
  const state = link.href.includes("pa.gov") || link.source.toLowerCase().includes("ddap") ? "PA" : null;
  addLink(link, state, "help");
}

for (const link of nationalLinks) {
  const title = link.title.toLowerCase();
  const category = title.includes("shelter") ? "shelter" : title.includes("snap") || title.includes("food") ? "food" : "help";
  addLink(link, null, category);
}

addGroups(pennsylvaniaGroups, "PA");
addPlaces(centralPennsylvania, "PA");

for (const state of otherStates) {
  addGroups(state.groups, state.code);
  if (state.places) addPlaces(state.places, state.code);
  add({
    state: state.code,
    category: "help",
    title: `${state.name} community resources`,
    description: state.summary,
    url: `/resources/community#${state.code.toLowerCase()}`,
    source: "Aftercare Compass guide"
  });
}

for (const state of stateResources) {
  if (state.body.href) {
    addLink(
      {
        title: state.body.name,
        href: state.body.href,
        source: state.body.name,
        description: state.oversightLabel
      },
      state.code,
      "licensing"
    );
  }
  for (const link of state.links) addLink(link, state.code, "licensing");
  if (state.local) {
    for (const link of state.local.links) {
      addLink(link, state.code, "licensing", { context: `${state.local.label}. ${state.local.description}` });
    }
  }
  if (state.narrAffiliate) addLink(state.narrAffiliate, state.code, "licensing");
  if (state.narrNote) {
    add({
      state: state.code,
      category: "licensing",
      title: `${state.name} NARR affiliate`,
      description: state.narrNote,
      url: `/resources/recovery-house-owners?state=${state.code}#state`,
      source: "Aftercare Compass guide"
    });
  }
  for (const link of state.fundingLinks ?? []) addLink(link, state.code, "licensing");
  add({
    state: state.code,
    category: "licensing",
    title: `${state.name} licensing and certification`,
    description: state.oversightLabel,
    url: `/resources/recovery-house-owners?state=${state.code}#state`,
    source: "Aftercare Compass guide"
  });
}

for (const link of federalOwnerFunding) addLink(link, null, "licensing");
for (const link of standardsLinks) addLink(link, null, "licensing");
for (const link of stateOwnerFunding) addLink(link, fundingState(link), "licensing");

entries.sort((a, b) => {
  if (!a.state && b.state) return -1;
  if (a.state && !b.state) return 1;
  return (a.stateName ?? "").localeCompare(b.stateName ?? "") || a.title.localeCompare(b.title);
});

export const resourceCatalog: CatalogEntry[] = entries;

export const resourceStates = stateResources
  .map((state) => ({ code: state.code, name: state.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function isResourceCategory(value: string | null | undefined): value is ResourceCategory {
  return resourceCategories.some((category) => category.id === value);
}

export function filterResources(
  source: CatalogEntry[],
  { state, category, query }: { state: string; category: ResourceCategory; query: string }
) {
  const q = query.trim().toLowerCase();
  return source.filter((entry) => {
    if (state !== "all" && entry.state !== state) return false;
    if (category !== "all" && entry.category !== category) return false;
    if (!q) return true;
    const hay = [entry.title, entry.description, entry.source, entry.stateName, entry.area, entry.context]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
