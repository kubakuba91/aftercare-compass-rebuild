"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { BedDouble, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type TrendingHome = {
  id: string;
  slug: string;
  programName: string;
  location: string;
  photoUrl: string | null;
  photoAlt: string;
  priceLabel: string;
  availabilityLabel: string;
  isAvailable: boolean;
  recoveryResidenceLevel: string | null;
};

export function TrendingHomes({ homes }: { homes: TrendingHome[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    const list = listRef.current;

    if (!list) {
      return;
    }

    list.scrollBy({
      behavior: "smooth",
      left: direction * Math.max(list.clientWidth * 0.8, 320)
    });
  }

  if (!homes.length) {
    return null;
  }

  return (
    <section aria-labelledby="trending-homes-heading" className="w-full border-b border-border bg-white">
      <div className="shell w-full py-10 md:py-12">
        <div className="flex items-end justify-between gap-5">
          <div>
            <h2 id="trending-homes-heading" className="text-2xl font-semibold md:text-3xl">
              Trending sober living homes in Lancaster, PA
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
              Explore popular local homes and see current listing details.
            </p>
          </div>

          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              aria-label="Show previous homes"
              className="focus-ring inline-flex size-11 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm hover:bg-muted"
              onClick={() => scroll(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={22} />
            </button>
            <button
              aria-label="Show more homes"
              className="focus-ring inline-flex size-11 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm hover:bg-muted"
              onClick={() => scroll(1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={22} />
            </button>
          </div>
        </div>

        <div
          ref={listRef}
          className="mt-6 flex w-full snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {homes.map((home) => (
            <Link
              key={home.id}
              className="focus-ring group w-full shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-lg sm:w-[340px]"
              href={`/profiles/${home.slug}`}
            >
              <article>
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {home.photoUrl ? (
                    <Image
                      alt={home.photoAlt}
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      fill
                      sizes="(max-width: 640px) calc(100vw - 32px), 340px"
                      src={home.photoUrl}
                      unoptimized
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.22),rgba(30,64,175,0.16)),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:100%_100%,34px_34px,34px_34px]"
                    />
                  )}
                  <Badge
                    className="absolute left-3 top-3 border-white/70 bg-white/95 shadow-sm"
                    tone={home.isAvailable ? "success" : "neutral"}
                  >
                    {home.availabilityLabel}
                  </Badge>
                </div>

                <div className="grid gap-3 p-5">
                  <div>
                    <h3 className="line-clamp-2 text-lg font-semibold leading-snug group-hover:text-primary">
                      {home.programName}
                    </h3>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin aria-hidden="true" className="shrink-0" size={16} />
                      {home.location}
                    </p>
                  </div>

                  <div className="flex min-h-6 items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="font-semibold">{home.priceLabel}</p>
                    {home.recoveryResidenceLevel ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <BedDouble aria-hidden="true" size={15} />
                        {home.recoveryResidenceLevel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <Link
          className="focus-ring mx-auto mt-2 flex min-h-11 w-fit items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-semibold shadow-sm hover:bg-muted"
          href="/search?type=sober_living&q=Lancaster%2C+PA"
        >
          View all Lancaster homes
        </Link>
      </div>
    </section>
  );
}
