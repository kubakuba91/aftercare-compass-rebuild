/** Saved manual state pick. The value is a state code or "all", never an IP or place name. */
export const RESOURCE_STATE_COOKIE = "ac_resource_state";

export const RESOURCE_STATE_ALL = "all";

export type ResourceStateSource = "url" | "saved" | "geo" | "default";

export type ResourceStateChoice = {
  state: string;
  source: ResourceStateSource;
};

export function firstParam(value?: string | string[] | null) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** Vercel sends a region like `PA` or, less often, `US-PA`. */
export function stateCodeFromRegion(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return null;
  const code = trimmed.includes("-") ? trimmed.slice(trimmed.lastIndexOf("-") + 1) : trimmed;
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/** A usable explicit choice: `all`, or a state this page actually lists. */
export function explicitKnownState(value: string | null | undefined, knownStates: readonly string[]) {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === RESOURCE_STATE_ALL) return RESOURCE_STATE_ALL;
  const code = stateCodeFromRegion(trimmed);
  if (!code) return null;
  return knownStates.some((item) => item.toUpperCase() === code) ? code : null;
}

/**
 * Precedence: an explicit URL state, then a saved manual pick, then a US geo
 * region we have content for, then the default (all states).
 */
export function resolveResourceState(input: {
  urlState?: string | null;
  savedState?: string | null;
  country?: string | null;
  region?: string | null;
  knownStates: readonly string[];
}): ResourceStateChoice {
  const url = explicitKnownState(input.urlState, input.knownStates);
  if (url) return { state: url, source: "url" };

  const saved = explicitKnownState(input.savedState, input.knownStates);
  if (saved) return { state: saved, source: "saved" };

  const country = input.country?.trim().toUpperCase() ?? "";
  const region = stateCodeFromRegion(input.region);
  if (country === "US" && region && input.knownStates.some((item) => item.toUpperCase() === region)) {
    return { state: region, source: "geo" };
  }

  return { state: RESOURCE_STATE_ALL, source: "default" };
}

export function resourceQueryHref(
  path: string,
  { state, tab, query, explicitAll = false }: { state: string; tab?: string; query?: string; explicitAll?: boolean }
) {
  const params = new URLSearchParams();
  if (state && state.toLowerCase() !== RESOURCE_STATE_ALL) params.set("state", state);
  else if (explicitAll) params.set("state", RESOURCE_STATE_ALL);
  if (tab && tab !== RESOURCE_STATE_ALL) params.set("tab", tab);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

/** Canonical path uses only the request URL. Geo and the saved cookie never change it. */
export function resourceCanonicalPath(
  path: string,
  params: { state?: string | string[] | null; tab?: string | string[] | null; q?: string | string[] | null },
  knownStates: readonly string[],
  normalizeTab: (value: string | null | undefined) => string
) {
  const explicit = explicitKnownState(firstParam(params.state), knownStates);
  const tab = normalizeTab(firstParam(params.tab));
  const query = (firstParam(params.q) ?? "").trim().slice(0, 200);
  return resourceQueryHref(path, {
    state: explicit && explicit !== RESOURCE_STATE_ALL ? explicit : RESOURCE_STATE_ALL,
    tab,
    query,
    explicitAll: false
  });
}

export function resourceStateCookie(state: string, secure = false) {
  const value = state.toLowerCase() === RESOURCE_STATE_ALL ? RESOURCE_STATE_ALL : state.toUpperCase();
  const secureAttr = secure ? "; Secure" : "";
  return `${RESOURCE_STATE_COOKIE}=${encodeURIComponent(value)}; Path=/resources; Max-Age=31536000; SameSite=Lax${secureAttr}`;
}

export function rememberResourceState(state: string) {
  if (typeof document === "undefined") return;
  document.cookie = resourceStateCookie(state, window.location.protocol === "https:");
}
