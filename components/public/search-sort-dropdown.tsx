"use client";

import { Dropdown } from "@heroui/react";
import { Check, ChevronDown, LoaderCircle } from "lucide-react";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { searchSortOptions, type SearchSort } from "@/lib/search-sort";

export function SearchSortDropdown({ value, canSortByDistance }: { value: SearchSort; canSortByDistance: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const options = searchSortOptions.filter((option) => option.key !== "distance" || canSortByDistance);
  const label = options.find((option) => option.key === value)?.label ?? "Recently updated";

  return (
    <div className="ml-auto flex items-center gap-2 text-sm" aria-busy={isPending}>
      <span className="shrink-0 text-muted-foreground">Sort by</span>
      <Dropdown>
        <Dropdown.Trigger
          aria-label={`Sort by: ${label}`}
          className="focus-ring flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold shadow-sm transition-colors hover:border-[#12185f]/40 disabled:opacity-60 sm:min-w-48"
          isDisabled={isPending}
        >
          <span>{label}</span>
          {isPending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : <ChevronDown aria-hidden="true" className="text-muted-foreground" size={16} />}
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom end" className="min-w-56 rounded-xl border border-border bg-white p-1.5 shadow-xl">
          <Dropdown.Menu
            aria-label="Sort search results"
            selectionMode="single"
            selectedKeys={[value]}
            onAction={(key) => {
              if (key === value) return;
              const params = new URLSearchParams(searchParams.toString());
              if (key === "updated") params.delete("sort");
              else params.set("sort", String(key));
              params.delete("page");
              params.delete("selected");
              startTransition(() => router.replace(`/search?${params.toString()}`, { scroll: false }));
            }}
          >
            {options.map((option) => (
              <Dropdown.Item
                key={option.key}
                id={option.key}
                textValue={option.label}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm outline-none data-[focused]:bg-[#12185f]/5 data-[selected]:bg-[#12185f]/5 data-[selected]:font-semibold data-[selected]:text-[#12185f]"
              >
                <span>{option.label}</span>
                {option.key === value ? <Check aria-hidden="true" size={16} /> : null}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <span className="sr-only" role="status">{isPending ? "Sorting results…" : ""}</span>
    </div>
  );
}
