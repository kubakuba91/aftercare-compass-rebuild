"use client";

import { Search } from "lucide-react";
import { quietTabClass } from "@/components/public/quiet-tab";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { normalizeOwnerGuideTab, ownerGuideHref, ownerGuideTabs, type OwnerGuideTab } from "@/lib/recovery-housing/owner-guide";

const ALL = "all";

export function OwnerGuideNav({ states }: { states: { code: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stateId = useId();
  const searchId = useId();
  const requestedState = searchParams.get("state")?.toUpperCase() ?? ALL;
  const state = states.some((item) => item.code === requestedState) ? requestedState : ALL;
  const requestedTab = searchParams.get("tab");
  const tab = normalizeOwnerGuideTab(requestedTab);
  const query = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(query);
  const ordered = [...states].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (requestedTab !== "licensing-funding") return;
    router.replace(ownerGuideHref(state, "licensing", query), { scroll: false });
  }, [query, requestedTab, router, state]);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (draft === query) return;
      router.push(ownerGuideHref(state, tab, draft), { scroll: false });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [draft, query, router, state, tab]);

  const go = (nextState: string, nextTab: OwnerGuideTab) => {
    router.push(ownerGuideHref(nextState, nextTab, draft), { scroll: false });
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const ids = ownerGuideTabs.map((item) => item.id);
    const index = ids.indexOf(tab);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % ids.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + ids.length) % ids.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ids.length - 1;
    else return;
    event.preventDefault();
    const id = ids[next];
    go(state, id);
    document.getElementById(`owner-tab-${id}`)?.focus();
  };

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
            onChange={(event) => go(event.target.value, tab)}
            value={state}
          >
            <option value={ALL}>All states</option>
            {ordered.map((item) => (
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
        aria-label="Owner guide sections"
        className="mt-6 flex gap-6 overflow-x-auto border-b border-border"
        onKeyDown={onTabKeyDown}
        role="tablist"
      >
        {ownerGuideTabs.map((item) => {
          const selected = item.id === tab;
          return (
            <button
              aria-controls="owner-guide-results"
              aria-selected={selected}
              className={quietTabClass(selected)}
              id={`owner-tab-${item.id}`}
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
      <p className="mt-3 text-sm text-muted-foreground">
        Showing the states where Aftercare Compass lists programs today: {states.map((item) => item.code).join(", ")}.
      </p>
    </div>
  );
}
