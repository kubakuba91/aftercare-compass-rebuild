import { normalizeSearchText, searchPlaces, stateNameByCode, type SearchPlace } from "@/lib/resources/places";

export type ResolvedPlace = {
  state: string;
  stateName: string;
  label: string;
  city?: string;
  county?: string;
  /** Phrases that should rank a resource above other results in the same state. */
  boostTerms: string[];
};

export type SearchInterpretation = {
  query: string;
  tokens: string[];
  place: ResolvedPlace | null;
  /** Words that still have to appear in the resource, after the place name is removed. */
  contentTokens: string[];
};

const topicLabels = [
  { id: "housing", label: "Housing" },
  { id: "food", label: "Food" },
  { id: "shelter", label: "Shelter" },
  { id: "employment", label: "Employment" },
  { id: "transit", label: "Transit" },
  { id: "licensing", label: "Licensing" },
  { id: "funding", label: "Funding" },
  { id: "help", label: "Help finding services" },
  { id: "recovery", label: "Recovery Meetings" },
  { id: "family", label: "Family & Children" },
  { id: "veterans", label: "Veterans" }
];

type IndexedPlace = SearchPlace & { phrase: string };

const exactPlaces = new Map<string, IndexedPlace[]>();

for (const place of searchPlaces) {
  for (const phrase of new Set(place.names.map(normalizeSearchText).filter(Boolean))) {
    const list = exactPlaces.get(phrase) ?? [];
    if (!list.some((item) => item.state === place.state && item.city === place.city && item.county === place.county)) {
      list.push({ ...place, phrase });
    }
    exactPlaces.set(phrase, list);
  }
}

for (const [phrase, list] of exactPlaces) {
  const states = new Set(list.map((item) => item.state));
  if (states.size > 1) exactPlaces.delete(phrase);
}

const phrasesByLength = [...exactPlaces.keys()].sort((a, b) => b.length - a.length);

function editDistance(left: string, right: string, max: number) {
  if (Math.abs(left.length - right.length) > max) return max + 1;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    let rowMin = current[0];
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > max) return max + 1;
    previous = current;
  }
  return previous[right.length];
}

function fuzzyLimit(token: string) {
  if (token.length >= 8) return 2;
  if (token.length >= 5) return 1;
  return 0;
}

function uniquePlace(list: IndexedPlace[] | undefined) {
  if (!list?.length) return null;
  const states = new Set(list.map((item) => item.state));
  if (states.size !== 1) return null;
  return list[0];
}

function fuzzyPlace(token: string) {
  const limit = fuzzyLimit(token);
  if (!limit) return null;
  let best: IndexedPlace | null = null;
  let bestDistance = limit + 1;
  let ties = 0;
  for (const [phrase, list] of exactPlaces) {
    if (phrase.includes(" ") || Math.abs(phrase.length - token.length) > limit) continue;
    const distance = editDistance(token, phrase, limit);
    if (distance > limit || distance === 0) continue;
    const place = uniquePlace(list);
    if (!place) continue;
    if (distance < bestDistance) {
      best = place;
      bestDistance = distance;
      ties = 1;
    } else if (distance === bestDistance && place.state !== best?.state) {
      ties += 1;
    }
  }
  return ties === 1 ? best : null;
}

function toResolved(place: SearchPlace, phrase: string): ResolvedPlace {
  const stateName = stateNameByCode[place.state] ?? place.state;
  const label = place.city ? `${place.city}, ${stateName}` : place.county ? `${place.county}, ${stateName}` : stateName;
  const boostTerms = [...new Set([place.city, place.county, phrase, ...(place.city ? [`${place.city} county`] : [])].filter(Boolean) as string[])].map(normalizeSearchText);
  return { state: place.state, stateName, label, city: place.city, county: place.county, boostTerms };
}

export function interpretSearch(query: string): SearchInterpretation {
  const normalized = normalizeSearchText(query);
  const tokens = normalized.split(" ").filter(Boolean);
  if (!tokens.length) return { query: "", tokens: [], place: null, contentTokens: [] };

  let matchedPhrase = "";
  let matched: IndexedPlace | null = null;
  for (let size = Math.min(tokens.length, 4); size >= 1 && !matched; size -= 1) {
    for (let start = 0; start <= tokens.length - size; start += 1) {
      const phrase = tokens.slice(start, start + size).join(" ");
      const exact = uniquePlace(exactPlaces.get(phrase));
      const place = exact ?? (size === 1 ? fuzzyPlace(phrase) : null);
      if (!place) continue;
      if (!matched || phrase.length > matchedPhrase.length) {
        matched = place;
        matchedPhrase = phrase;
      }
    }
  }

  const place = matched ? toResolved(matched, matchedPhrase) : null;
  const consumed = new Set(matchedPhrase.split(" ").filter(Boolean));
  const contentTokens = tokens.filter((token) => !consumed.has(token));
  return { query: normalized, tokens, place, contentTokens };
}

function wordsOf(text: string) {
  return normalizeSearchText(text).split(" ").filter((word) => word.length > 1);
}

export function tokenMatches(token: string, text: string) {
  if (!token) return true;
  const normalized = normalizeSearchText(text);
  if (!normalized) return false;
  if (token.length >= 4 && normalized.includes(token)) return true;
  const limit = fuzzyLimit(token);
  for (const word of wordsOf(normalized)) {
    if (word === token) return true;
    if (token.length >= 4 && word.length >= 4 && (word.startsWith(token) || token.startsWith(word))) return true;
    if (limit && editDistance(token, word, limit) <= limit) return true;
  }
  return false;
}

export function tokensMatch(tokens: string[], text: string) {
  return tokens.every((token) => tokenMatches(token, text));
}

export function contentMatches(text: string, query: string, scope?: { state?: string | null; national?: boolean }) {
  const search = interpretSearch(query);
  if (!search.query) return true;
  if (search.place) {
    const inPlace = scope?.national || !scope?.state || scope.state === search.place.state || tokensMatch(search.place.boostTerms, text);
    if (!inPlace) return tokensMatch(search.tokens, text);
    if (!search.contentTokens.length) return true;
    return tokensMatch(search.contentTokens, text);
  }
  return tokensMatch(search.tokens, text);
}

export function entrySearchText(entry: {
  title: string;
  description?: string;
  source?: string;
  state?: string | null;
  stateName?: string | null;
  area?: string;
  context?: string;
  tags?: string[];
  category?: string;
}) {
  const topic = topicLabels.find((item) => item.id === entry.category)?.label;
  return [entry.title, entry.description, entry.source, entry.state, entry.stateName, entry.area, entry.context, topic, ...(entry.tags ?? [])]
    .filter(Boolean)
    .join(" ");
}

export function scoreEntry(entry: { state?: string | null; title: string }, text: string, search: SearchInterpretation) {
  if (!search.query) return 0;
  let score = 0;
  if (search.place) {
    if (entry.state && entry.state === search.place.state) score += 10;
    if (search.place.boostTerms.some((term) => term.length >= 4 && normalizeSearchText(text).includes(term))) score += 100;
  }
  if (search.contentTokens.some((token) => normalizeSearchText(entry.title).includes(token))) score += 20;
  return score;
}

export function entryMatches(
  entry: {
    title: string;
    description?: string;
    source?: string;
    state?: string | null;
    stateName?: string | null;
    area?: string;
    context?: string;
    tags?: string[];
    category?: string;
  },
  search: SearchInterpretation,
  dropdownState: string
) {
  if (dropdownState !== "all" && entry.state && entry.state !== dropdownState) return false;
  if (!search.query) return true;
  const text = entrySearchText(entry);
  const placeApplies = search.place && (dropdownState === "all" || dropdownState === search.place.state);
  if (placeApplies && search.place) {
    const inPlace = !entry.state || entry.state === search.place.state;
    if (!inPlace) return false;
    if (!search.contentTokens.length) return true;
    return tokensMatch(search.contentTokens, text);
  }
  return tokensMatch(search.tokens, text);
}

export type SearchSuggestion = {
  stateCode?: string;
  stateName?: string;
  topicId?: string;
  topicLabel?: string;
  placeLabel?: string;
  /** Passed to /search as q, already in "City, ST" form when we know both. */
  directoryQuery: string;
};

function nearestTopic(query: string) {
  const token = normalizeSearchText(query).split(" ").find((word) => word.length >= 4) ?? "";
  if (!token) return null;
  let best: (typeof topicLabels)[number] | null = null;
  let bestDistance = 3;
  for (const topic of topicLabels) {
    for (const word of normalizeSearchText(topic.label).split(" ")) {
      if (word.length < 4) continue;
      const distance = editDistance(token, word, 2);
      if (distance > 0 && distance < bestDistance) {
        best = topic;
        bestDistance = distance;
      }
    }
  }
  return best;
}

export function suggestSearch(query: string, dropdownState = "all"): SearchSuggestion | null {
  const search = interpretSearch(query);
  if (!search.query) return null;
  const place = search.place && dropdownState !== "all" && dropdownState !== search.place.state ? search.place : search.place;
  const topic = nearestTopic(query);
  const stateCode = place?.state;
  const stateName = place ? place.stateName : undefined;
  const directoryQuery = place?.city ? `${place.city}, ${place.state}` : place ? place.state : query.trim();
  return {
    stateCode,
    stateName,
    topicId: topic?.id,
    topicLabel: topic?.label,
    placeLabel: place?.label,
    directoryQuery
  };
}

export function phrasesForTests() {
  return phrasesByLength;
}
