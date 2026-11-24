"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from "react";
import {
  filterResources,
  isResourceCategory,
  resourceCatalog,
  resourceCategories,
  resourceStates,
  type CatalogEntry,
  type ResourceCategory
} from "@/lib/resources/catalog";

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

function directoryHref(kind: "housing" | "continued", state: string) {
  const params = new URLSearchParams();
  if (kind === "continued") params.set("type", "continued_care");
  if (state !== ALL) params.set("q", state);
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

export function ResourcesBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stateId = useId();
  const searchId = useId();
  const requestedState = searchParams.get("state")?.toUpperCase() ?? ALL;
  const state = resourceStates.some((item) => item.code === requestedState) ? requestedState : ALL;
  const requestedTab = searchParams.get("tab");
  const category: ResourceCategory = isResourceCategory(requestedTab) ? requestedTab : ALL;
  const query = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(query);

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
        className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible"
        onKeyDown={onTabKeyDown}
        role="tablist"
      >
        {resourceCategories.map((item) => {
          const selected = item.id === category;
          return (
            <button
              aria-controls="resource-results"
              aria-selected={selected}
              className={`focus-ring shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                selected ? "bg-[#12185f] text-white" : "border border-border bg-white text-[#17212b] hover:border-[#12185f]/40"
              }`}
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
        {category === "recovery" || category === "family" || category === "veterans" ? (
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
        {results.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-white p-8 text-center">
            <p className="text-lg font-semibold text-[#17212b]">{empty}</p>
            <p className="mt-2 text-sm text-muted-foreground">Try another state or topic, or clear the filters.</p>
            <Link className="focus-ring mt-4 inline-flex rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline" href="/resources">
              Clear filters
            </Link>
          </div>
        ) : state === ALL ? (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {results.map((entry) => (
              <li key={entry.id}>
                <ResultCard entry={entry} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 space-y-8">
            {[
              { label: stateName, items: results.filter((entry) => entry.state) },
              { label: "National", items: results.filter((entry) => !entry.state) }
            ]
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <section key={group.label}>
                  <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{group.label}</h2>
                  <ul className="mt-4 grid gap-4 md:grid-cols-2">
                    {group.items.map((entry) => (
                      <li key={entry.id}>
                        <ResultCard entry={entry} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
