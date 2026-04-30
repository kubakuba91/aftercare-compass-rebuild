"use client";

import { useMemo, useState } from "react";

type MultiSelectDropdownProps = {
  name: string;
  options: readonly string[];
  selected?: string[];
};

export function MultiSelectDropdown({ name, options, selected = [] }: MultiSelectDropdownProps) {
  const [selectedValues, setSelectedValues] = useState(() => new Set(selected));

  const summary = useMemo(() => {
    if (!selectedValues.size) {
      return "Select options";
    }

    return options.filter((option) => selectedValues.has(option)).join(", ");
  }, [options, selectedValues]);

  function toggleValue(option: string) {
    setSelectedValues((current) => {
      const next = new Set(current);

      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }

      return next;
    });
  }

  return (
    <details className="rounded-md border border-border bg-white">
      <summary className="flex min-h-10 cursor-pointer list-none items-start justify-between gap-3 px-3 py-2 text-sm">
        <span className="text-muted-foreground">{summary}</span>
        <span aria-hidden="true" className="mt-0.5 shrink-0">
          ▾
        </span>
      </summary>
      <div className="grid max-h-72 gap-2 overflow-auto border-t border-border p-3">
        {options.map((option) => (
          <label key={option} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted">
            <input
              type="checkbox"
              name={name}
              value={option}
              checked={selectedValues.has(option)}
              onChange={() => toggleValue(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </details>
  );
}
