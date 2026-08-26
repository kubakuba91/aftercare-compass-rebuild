"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LoadMoreListings({
  hasMore,
  loadedCount,
  nextHref,
  totalCount
}: {
  hasMore: boolean;
  loadedCount: number;
  nextHref: string;
  totalCount: number;
}) {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navigationStartedRef = useRef(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    navigationStartedRef.current = false;
  }, [nextHref]);

  const loadMore = useCallback(() => {
    if (!hasMore || isPending || navigationStartedRef.current) {
      return;
    }

    navigationStartedRef.current = true;
    startTransition(() => {
      router.replace(nextHref, { scroll: false });
    });
  }, [hasMore, isPending, nextHref, router]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!hasMore || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (!hasMore) {
    return totalCount > 0 ? (
      <p className="py-4 text-center text-sm text-muted-foreground">
        All {totalCount} listings loaded
      </p>
    ) : null;
  }

  return (
    <div ref={sentinelRef} className="flex flex-col items-center gap-2 py-4">
      <button
        className="focus-ring rounded-full border border-border bg-white px-5 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-wait disabled:opacity-60"
        disabled={isPending}
        onClick={loadMore}
        type="button"
      >
        {isPending ? "Loading more listings…" : "Load more listings"}
      </button>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        Showing {loadedCount} of {totalCount}
      </p>
    </div>
  );
}
