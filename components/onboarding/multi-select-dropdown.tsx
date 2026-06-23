"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

type MultiSelectDropdownProps = {
  name: string;
  options: readonly string[];
  placeholder?: string;
  selected?: string[];
  closeOnSelect?: boolean;
  maxVisibleChips?: number;
};

export function MultiSelectDropdown({
  name,
  options,
  placeholder = "Select options",
  selected = [],
  closeOnSelect = false,
  maxVisibleChips = 5
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState(() => new Set(selected));

  const summary = useMemo(() => {
    return options.filter((option) => selectedValues.has(option));
  }, [options, selectedValues]);
  const selectedInputs = useMemo(() => Array.from(selectedValues), [selectedValues]);
  const visibleSummary = summary.slice(0, maxVisibleChips);
  const hiddenSummaryCount = Math.max(0, summary.length - visibleSummary.length);

  function toggleValue(option: string) {
    setSelectedValues((current) => {
      const next = new Set(current);

      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }

      document.dispatchEvent(
        new CustomEvent("aftercare:multiselect-change", {
          detail: {
            name,
            values: Array.from(next)
          }
        })
      );

      return next;
    });

    if (closeOnSelect) {
      setIsOpen(false);
    }
  }

  return (
    <details
      className="ac-multiselect"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      open={isOpen}
    >
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm">
        <span className="ac-multiselect__summary flex min-w-0 flex-1 flex-wrap gap-1.5" data-selected={selectedValues.size ? "true" : "false"}>
          {visibleSummary.length ? (
            <>
              {visibleSummary.map((option) => (
                <span key={option} className="ac-multiselect__chip">
                  {option}
                </span>
              ))}
              {hiddenSummaryCount ? (
                <span className="ac-multiselect__chip ac-multiselect__chip--count">
                  +{hiddenSummaryCount}
                </span>
              ) : null}
            </>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </span>
        <ChevronDown aria-hidden="true" className="shrink-0 text-muted-foreground" size={16} />
      </summary>
      {selectedInputs.map((value) => (
        <input key={value} name={name} type="hidden" value={value} />
      ))}
      <div className="ac-multiselect__menu grid max-h-72 gap-2 overflow-auto p-3">
        {options.map((option) => (
          <label key={option} className="ac-multiselect__option flex min-h-9 items-center gap-2 px-2 text-sm">
            <input
              type="checkbox"
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
