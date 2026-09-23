"use client";

import type { ChangeEvent } from "react";

export function SearchTypeSelector({ defaultType, showFilters }: { defaultType: string; showFilters: boolean }) {
  function changeType(event: ChangeEvent<HTMLInputElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (typeof value === "string" && value) params.append(key, value);
    }
    // These criteria belong to the previous program type.
    for (const key of ["delivery", "virtualState", "minPrice", "maxPrice", "amenity", "levelOfCare", "clinicalFocus", "insurance", "duration", "page", "selected"]) {
      params.delete(key);
    }
    params.set("type", event.currentTarget.value);
    if (showFilters) params.set("filters", "1");
    window.location.assign(`/search?${params.toString()}`);
  }

  return (
          <div className="grid h-14 gap-1.5 overflow-hidden rounded-lg border border-[#12185f] bg-[#12185f] p-2 sm:grid-cols-2">
            <label className="focus-within:ring-ring flex h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-4 text-center text-sm font-semibold text-white transition-colors has-[:checked]:bg-white has-[:checked]:text-[#17212b] has-[:focus-visible]:ring-2">
              <input
                className="sr-only"
                defaultChecked={defaultType === "sober_living" || !defaultType}
                name="type"
                onChange={changeType}
                type="radio"
                value="sober_living"
              />
              Sober Living
            </label>
            <label className="focus-within:ring-ring flex h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-4 text-center text-sm font-semibold text-white transition-colors has-[:checked]:bg-white has-[:checked]:text-[#17212b] has-[:focus-visible]:ring-2">
              <input
                className="sr-only"
                defaultChecked={defaultType === "continued_care"}
                name="type"
                onChange={changeType}
                type="radio"
                value="continued_care"
              />
              Continued Care
            </label>
          </div>
  );
}
