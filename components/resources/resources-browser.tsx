"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { quietTabClass } from "@/components/public/quiet-tab";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from "react";
import {
  filterResources,
  normalizeResourceTab,
  resourceCatalog,
  resourceCategories,
  resourceStates,
  veteranSections,
  type CatalogEntry,
  type ResourceCategory
} from "@/lib/resources/catalog";
import { interpretSearch, suggestSearch } from "@/lib/resources/smart-search";

const ALL = "all";

function resourcesHref(state: string, category: ResourceCategory, query: string) {
  const params = new URLSearchParams();
  if (state !== ALL) params.set("state", state);
  if (category !== ALL) params.set("tab", category);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/resources?${search}` : "/resources";
}

function categoryLabel(category: ResourceCategory) {
  return resourceCategories.find((item) => item.id === category)?.label ?? "Resources";
}

function directoryHref(kind: "housing" | "continued", place: string) {
  const params = new URLSearchParams();
  if (kind === "continued") params.set("type", "continued_care");
  if (place && place !== ALL) params.set("q", place);
  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}

function ResultCard({ entry }: { entry: CatalogEntry }) {
  const external = entry.url.startsWith("http");
  const category = categoryLabel(entry.category);
  const place = entry.stateName ?? "National";
  const className =
    "focus-ring group flex h-full flex-col rounded-2xl border border-border bg-white p-5 text-left transition hover:border-primary/40 hover:shadow-[0_12px_32px_rgba(23,33,43,0.08)]";
  const body = (
    <>
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{entry.source}</span>
      <span className="mt-2 text-base font-semibold leading-6 text-[#17212b]">{entry.title}</span>
      <span className="mt-2 text-sm leading-6 text-muted-foreground">{entry.description}</span>
      <span className="mt-4 text-xs font-medium text-[#17212b]">
        {place}
        {entry.area ? ` · ${entry.area}` : ""} · {category}
      </span>
      {external ? <span className="sr-only">(opens in a new tab)</span> : null}
    </>
  );

  if (external) {
    return (
      <a className={className} href={entry.url} rel="noopener noreferrer" target="_blank">
        {body}
      </a>
    );
  }

  return (
    <Link className={className} href={entry.url}>
      {body}
    </Link>
  );
}

function anchorIds(entries: CatalogEntry[]) {
  const totals = new Map<string, number>();
  for (const entry of entries) totals.set(entry.slug, (totals.get(entry.slug) ?? 0) + 1);
  const used = new Set<string>();
  const ids = new Map<string, string>();
  for (const entry of entries) {
    let id = (totals.get(entry.slug) ?? 0) > 1 ? `${entry.slug}-${entry.category}` : entry.slug;
    if (used.has(id)) id = `${entry.slug}-${entry.id}`;
    used.add(id);
    ids.set(entry.id, id);
  }
  return ids;
}

function ResultGrid({ entries, ids }: { entries: CatalogEntry[]; ids: Map<string, string> }) {
  return (
    <ul className="mt-4 grid gap-4 md:grid-cols-2">
      {entries.map((entry) => (
        <li className="scroll-mt-24" id={ids.get(entry.id)} key={entry.id}>
          <ResultCard entry={entry} />
        </li>
      ))}
    </ul>
  );
}

export function ResourcesBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stateId = useId();
  const searchId = useId();
  const requestedState = searchParams.get("state")?.toUpperCase() ?? ALL;
  const state = resourceStates.some((item) => item.code === requestedState) ? requestedState : ALL;
  const requestedTab = searchParams.get("tab");
  const category = normalizeResourceTab(requestedTab);
  const query = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    if (requestedTab !== "licensing-funding") return;
    router.replace(resourcesHref(state, "licensing", query), { scroll: false });
  }, [query, requestedTab, router, state]);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (draft === query) return;
      router.push(resourcesHref(state, category, draft), { scroll: false });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [category, draft, query, router, state]);

  const results = useMemo(
    () => filterResources(resourceCatalog, { state, category, query }),
    [state, category, query]
  );
  const ids = useMemo(() => anchorIds(results), [results]);
  const search = useMemo(() => interpretSearch(query), [query]);

  useEffect(() => {
    const raw = window.location.hash.slice(1);
    if (!raw) return;
    let id = raw;
    try {
      id = decodeURIComponent(raw);
    } catch {
      id = raw;
    }
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [results]);
  const suggestion = results.length === 0 ? suggestSearch(query, state) : null;
  const groupCode = state !== ALL ? state : search.place && (state === ALL || state === search.place.state) ? search.place.state : ALL;

  const go = (nextState: string, nextCategory: ResourceCategory) => {
    router.push(resourcesHref(nextState, nextCategory, draft), { scroll: false });
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const ids = resourceCategories.map((item) => item.id);
    const index = ids.indexOf(category);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % ids.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + ids.length) % ids.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ids.length - 1;
    else return;
    event.preventDefault();
    const id = ids[next];
    go(state, id);
    document.getElementById(`resource-tab-${id}`)?.focus();
  };

  const stateName = resourceStates.find((item) => item.code === state)?.name ?? state;
  const groupName = resourceStates.find((item) => item.code === groupCode)?.name ?? groupCode;
  const topic = categoryLabel(category);
  const q = query.trim();
  const empty = q
    ? category === ALL
      ? state === ALL
        ? `No resources match “${q}”.`
        : `No resources in ${stateName} match “${q}”.`
      : state === ALL
        ? `No resources for ${topic} match “${q}”.`
        : `No resources for ${topic} in ${stateName} match “${q}”.`
    : category === ALL
      ? `No resources in ${stateName} yet.`
      : state === ALL
        ? `No resources for ${topic} yet.`
        : `No resources for ${topic} in ${stateName} yet.`;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div>
          <label className="text-sm font-semibold text-[#17212b]" htmlFor={stateId}>
            State
          </label>
          <select
            className="focus-ring mt-2 w-full min-h-12 rounded-xl border border-border bg-white px-3 text-base font-medium text-[#17212b] shadow-sm"
            id={stateId}
            onChange={(event) => go(event.target.value, category)}
            value={state}
          >
            <option value={ALL}>All states</option>
            {resourceStates.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-[#17212b]" htmlFor={searchId}>
            Search
          </label>
          <div className="relative mt-2">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              className="focus-ring w-full min-h-12 rounded-xl border border-border bg-white py-2 pl-12 pr-3 text-base text-[#17212b] shadow-sm placeholder:text-muted-foreground"
              id={searchId}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Keyword, agency, or city"
              role="searchbox"
              type="text"
              value={draft}
            />
          </div>
        </div>
      </div>

      <div
        aria-label="Resource categories"
        className="mt-6 flex gap-6 overflow-x-auto border-b border-border"
        onKeyDown={onTabKeyDown}
        role="tablist"
      >
        {resourceCategories.map((item) => {
          const selected = item.id === category;
          return (
            <button
              aria-controls="resource-results"
              aria-selected={selected}
              className={quietTabClass(selected)}
              id={`resource-tab-${item.id}`}
              key={item.id}
              onClick={() => go(state, item.id)}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div aria-labelledby={`resource-tab-${category}`} className="mt-6" id="resource-results" role="tabpanel">
        {category === "recovery" || category === "family" || category === "veterans" || category === "funding" ? (
          <div className="mb-5 rounded-2xl border border-border bg-[#f4f8ff] p-5">
            <p className="text-sm leading-6 text-[#17212b]">
              For a recovery house or a continued care program, search the Aftercare Compass directory.
            </p>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
              <Link className="focus-ring rounded-md text-primary underline-offset-4 hover:underline" href={directoryHref("housing", state)}>
                Recovery housing
              </Link>
              <Link className="focus-ring rounded-md text-primary underline-offset-4 hover:underline" href={directoryHref("continued", state)}>
                Continued care
              </Link>
            </p>
          </div>
        ) : null}
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {results.length} {results.length === 1 ? "resource" : "resources"}
        </p>
        {search.place && results.length > 0 && (state === ALL || state === search.place.state) ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {search.place.label} is in {search.place.stateName}. Matches for that place are listed first, then other {search.place.stateName} resources and national resources.
          </p>
        ) : null}
        {results.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-white p-8 text-center">
            <p className="text-lg font-semibold text-[#17212b]">{empty}</p>
            {suggestion?.stateName ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {suggestion.placeLabel ? `${suggestion.placeLabel} is in ${suggestion.stateName}.` : `Try ${suggestion.stateName}.`}
                {suggestion.topicLabel ? ` Or look under ${suggestion.topicLabel}.` : ""}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Try another state or topic, or clear the filters.</p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
              {suggestion?.stateCode ? (
                <Link className="focus-ring rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline" href={resourcesHref(suggestion.stateCode, category, query)}>
                  Show {suggestion.stateName}
                </Link>
              ) : null}
              {suggestion?.topicId ? (
                <Link className="focus-ring rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline" href={resourcesHref(state, suggestion.topicId as ResourceCategory, "")}>
                  Try {suggestion.topicLabel}
                </Link>
              ) : null}
              <Link className="focus-ring rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline" href={directoryHref("housing", suggestion?.directoryQuery || state)}>
                Recovery housing{suggestion?.placeLabel ? ` near ${suggestion.placeLabel}` : ""}
              </Link>
              <Link className="focus-ring rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline" href={directoryHref("continued", suggestion?.directoryQuery || state)}>
                Continued care
              </Link>
              <Link className="focus-ring rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline" href="/resources">
                Clear filters
              </Link>
            </div>
          </div>
        ) : category === "veterans" ? (
          <div className="mt-4 space-y-10">
            {veteranSections
              .map((section) => ({
                ...section,
                items: results.filter((entry) => (entry.section ?? "veterans") === section.id)
              }))
              .filter((section) => section.items.length > 0)
              .map((section) => {
                const groups =
                  groupCode === ALL
                    ? [{ label: null as string | null, items: section.items }]
                    : [
                        { label: groupName, items: section.items.filter((entry) => entry.state) },
                        { label: "National", items: section.items.filter((entry) => !entry.state) }
                      ].filter((group) => group.items.length > 0);
                return (
                  <section key={section.id}>
                    <h2 className="text-lg font-semibold text-[#17212b]">{section.label}</h2>
                    <div className="mt-4 space-y-8">
                      {groups.map((group) => (
                        <div key={group.label ?? section.id}>
                          {group.label ? <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{group.label}</h3> : null}
                          <ResultGrid entries={group.items} ids={ids} />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
          </div>
        ) : groupCode === ALL ? (
          <ResultGrid entries={results} ids={ids} />
        ) : (
          <div className="mt-4 space-y-8">
            {[
              { label: groupName, items: results.filter((entry) => entry.state) },
              { label: "National", items: results.filter((entry) => !entry.state) }
            ]
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <section key={group.label}>
                  <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{group.label}</h2>
                  <ResultGrid entries={group.items} ids={ids} />
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
