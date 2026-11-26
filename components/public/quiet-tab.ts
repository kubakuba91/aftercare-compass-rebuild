/** Underline tabs for public pages. Selected state is a navy rule, not a filled pill. */
export function quietTabClass(selected: boolean) {
  return `focus-ring shrink-0 -mb-px border-b-2 px-0.5 py-3 text-sm font-medium ${
    selected ? "border-[#10195e] text-[#10195e]" : "border-transparent text-[#5c6b7a] hover:text-[#17212b]"
  }`;
}
