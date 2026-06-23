"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type DataSettingsCategoryTab = {
  key: string;
  label: string;
  activeCount: number;
};

export function DataSettingsCategoryTabs({
  activeCategory,
  categories
}: {
  activeCategory: string;
  categories: DataSettingsCategoryTab[];
}) {
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  }, [activeCategory]);

  return (
    <nav className="ac-tabs ac-tabs--category-window min-w-0 flex-1" aria-label="Data settings categories">
      {categories.map((category) => {
        const selected = activeCategory === category.key;

        return (
          <Link
            className="focus-ring ac-tab"
            data-active={selected ? "true" : "false"}
            href={`/dashboard/admin?tab=data-settings&dataCategory=${category.key}`}
            key={category.key}
            ref={selected ? activeTabRef : undefined}
          >
            <span>{category.label}</span>
            <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-semibold">
              {category.activeCount}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
