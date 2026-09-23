"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

export function SearchFilterPanel({ children, title, clearHref }: { children: ReactNode; title: string; clearHref: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 16, left: 16 });

  useLayoutEffect(() => {
    const element = panel.current!;
    const update = () => {
      const form = element.closest("form")!;
      const trigger = form.querySelector('[name="filters"]')!.getBoundingClientRect();
      const width = Math.min(420, window.innerWidth - 32);
      setPosition({
        top: Math.max(16, Math.min(trigger.bottom + 12, window.innerHeight - 256)),
        left: Math.max(16, Math.min(trigger.right - width, window.innerWidth - width - 16))
      });
    };
    const onScroll = (event: Event) => { if (!element.contains(event.target as Node)) update(); };
    const onWheel = (event: WheelEvent) => {
      // Keep wheel gestures over the fixed header/footer inside the filter frame too.
      if (!body.current?.contains(event.target as Node)) {
        event.preventDefault();
        body.current?.scrollBy({ top: event.deltaY });
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", onScroll, true);
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", onScroll, true);
      element.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div ref={panel} role="region" aria-label={title} className="fixed z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-border bg-white shadow-lg" style={{ ...position, maxHeight: `calc(100dvh - ${position.top + 16}px)` }}>
      <h2 className="shrink-0 border-b border-border px-5 py-4 text-lg font-semibold">{title}</h2>
      <div ref={body} className="grid min-h-0 gap-4 overflow-y-auto overscroll-contain p-5">{children}</div>
      <div className="flex shrink-0 items-center gap-3 border-t border-border bg-white p-4">
        <button type="submit" className="focus-ring ac-button ac-button--primary flex-1">Apply</button>
        <Link className="focus-ring ac-button ac-button--secondary" href={clearHref}>Clear all</Link>
      </div>
    </div>
  );
}
