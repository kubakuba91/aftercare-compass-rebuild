"use client";

import { useMemo, useState } from "react";

type MultiSelectDropdownProps = {
  name: string;
  options: readonly string[];
  placeholder?: string;
  selected?: string[];
  closeOnSelect?: boolean;
};

export function MultiSelectDropdown({
  name,
  options,
  placeholder = "Select options",
  selected = [],
  closeOnSelect = false
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState(() => new Set(selected));

  const summary = useMemo(() => {
    if (!selectedValues.size) {
      return placeholder;
    }

    return options.filter((option) => selectedValues.has(option)).join(", ");
  }, [options, placeholder, selectedValues]);

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
      <summary className="flex min-h-10 cursor-pointer list-none items-start justify-between gap-3 px-3 py-2 text-sm">
        <span className="ac-multiselect__summary" data-selected={selectedValues.size ? "true" : "false"}>
          {summary}
        </span>
        <span aria-hidden="true" className="mt-0.5 shrink-0">
          ▾
        </span>
      </summary>
      <div className="ac-multiselect__menu grid max-h-72 gap-2 overflow-auto p-3">
        {options.map((option) => (
          <label key={option} className="ac-multiselect__option flex min-h-9 items-center gap-2 px-2 text-sm">
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
