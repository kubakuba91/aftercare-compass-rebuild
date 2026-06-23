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
  const viewportRef = useRef<HTMLElement | null>(null);
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const activeTab = activeTabRef.current;

    if (!viewport || !activeTab) {
      return;
    }

    const targetLeft = activeTab.offsetLeft - (viewport.clientWidth - activeTab.offsetWidth) / 2;
    viewport.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
  }, [activeCategory]);

  return (
    <nav
      className="ac-category-tabs"
      aria-label="Data settings categories"
      ref={viewportRef}
    >
      <div className="ac-category-tabs__strip">
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
      </div>
    </nav>
  );
}
