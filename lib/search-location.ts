import { Prisma } from "@prisma/client";

export const stateAliases: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC"
};

const states = Object.entries(stateAliases).map(([name, code]) => ({
  name: name.replace(/\b\w/g, letter => letter.toUpperCase()), code,
  coverage: code === "DC" ? "Washington, DC" : name.replace(/\b\w/g, letter => letter.toUpperCase())
}));

function findState(value: string) {
  const lower = value.toLowerCase();
  return states.find(state => state.code.toLowerCase() === lower || state.name.toLowerCase() === lower || state.coverage.toLowerCase() === lower);
}

export function parseSearchLocation(query: string) {
  const value = query.trim().replace(/\s+/g, " ");
  const exact = findState(value);
  if (exact) return { state: exact, city: "" };
  // A comma is an explicit city/state separator. Ambiguous lowercase words
  // such as "in" stay ordinary text when they appear inside a longer query.
  const comma = value.lastIndexOf(",");
  const suffix = comma >= 0 ? value.slice(comma + 1).trim() : value.split(" ").at(-1) || "";
  if (comma < 0 && (!/^[a-z]{2}$/i.test(suffix) || (suffix !== suffix.toUpperCase() && ["in", "or", "me", "hi", "ok", "id"].includes(suffix)))) return null;
  const state = findState(suffix);
  const city = (comma >= 0 ? value.slice(0, comma) : value.slice(0, -suffix.length)).trim();
  return state && city ? { state, city } : null;
}

type SearchLocation = NonNullable<ReturnType<typeof parseSearchLocation>>;

export function searchLocationWhere({ state, city }: SearchLocation): Prisma.AftercareProfileWhereInput {
  return { OR: [
    { AND: [
      { OR: [{ telehealthMode: null }, { telehealthMode: { not: "Virtual only" } }] },
      { OR: [state.code, state.name, state.coverage].map(value => ({ publicState: { equals: value, mode: Prisma.QueryMode.insensitive } })) },
      ...(city ? [{ publicCity: { contains: city, mode: Prisma.QueryMode.insensitive } }] : [])
    ] },
    { type: "continued_care", telehealthMode: "Virtual only", statesServed: { has: state.coverage } }
  ] };
}

export function removeSearchStateHref(query: Record<string, string | string[] | undefined>, location: SearchLocation) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (["q", "page", "selected", "radius"].includes(key)) continue;
    for (const item of Array.isArray(value) ? value : value ? [value] : []) params.append(key, item);
  }
  if (location.city) params.set("q", location.city);
  return `/search?${params.toString()}`;
}
