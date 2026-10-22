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
          <fieldset className="ac-search-segments">
            <legend className="sr-only">Program type</legend>
            <label className="ac-search-segment">
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
            <label className="ac-search-segment">
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
          </fieldset>
  );
}
