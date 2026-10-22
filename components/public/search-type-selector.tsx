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
          <div className="col-span-2 xl:col-span-1 grid min-h-11 xl:min-h-14 grid-cols-2 gap-1 rounded-lg border border-primary bg-primary p-1 xl:p-2">
            <label className="focus-within:ring-ring flex min-h-9 xl:min-h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-sm font-semibold text-white transition-colors has-[:checked]:bg-white has-[:checked]:text-[#17212b] has-[:focus-visible]:ring-2">
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
            <label className="focus-within:ring-ring flex min-h-9 xl:min-h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-sm font-semibold text-white transition-colors has-[:checked]:bg-white has-[:checked]:text-[#17212b] has-[:focus-visible]:ring-2">
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
