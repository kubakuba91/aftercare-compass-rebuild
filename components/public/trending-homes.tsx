"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { AdaptiveProfileImage } from "@/components/public/adaptive-profile-image";
import { Badge } from "@/components/ui/badge";

export type TrendingHome = {
  id: string;
  programType: "sober_living" | "continued_care";
  slug: string;
  programName: string;
  location: string;
  photoUrl: string | null;
  photoAlt: string;
  photoFocalX: number;
  photoFocalY: number;
  photoPresentationMode: string;
  priceAmount: string | null;
  tags: string[];
  availabilityLabel: string;
  isAvailable: boolean;
};

export function TrendingHomes({ homes, location }: { homes: TrendingHome[]; location: string | null }) {
  const label = "programs";
  const params = new URLSearchParams();
  if (location) params.set("q", location);
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
              Popular {label}{location ? ` near ${location}` : ""}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
              Explore popular {label} and see current listing details.
            </p>
          </div>

          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              aria-label="Show previous programs"
              className="focus-ring inline-flex size-11 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm hover:bg-muted"
              onClick={() => scroll(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={22} />
            </button>
            <button
              aria-label="Show more programs"
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
          className="mt-6 flex w-full snap-x snap-mandatory gap-6 overflow-x-auto pb-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {homes.map((home) => (
            <Link
              key={home.id}
              className="focus-ring group w-full shrink-0 snap-start overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-lg sm:w-[360px] lg:w-[calc((100%-48px)/3)]"
              href={`/profiles/${home.slug}`}
            >
              <article className="flex h-full flex-col">
                <div className="relative aspect-[1.88/1] overflow-hidden bg-muted">
                  {home.photoUrl ? (
                    <AdaptiveProfileImage
                      alt={home.photoAlt}
                      focalX={home.photoFocalX}
                      focalY={home.photoFocalY}
                      mode={home.photoPresentationMode}
                      sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 360px, 33vw"
                      src={home.photoUrl}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.22),rgba(30,64,175,0.16)),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:100%_100%,34px_34px,34px_34px]"
                    />
                  )}
                  <Badge
                    className={`absolute left-4 top-4 !rounded-full !px-3 !py-1.5 shadow-sm ${home.isAvailable ? "!border-emerald-200 !bg-emerald-50 !text-emerald-800" : "!border-amber-100 !bg-amber-50 !text-amber-800"}`}
                    tone={home.isAvailable ? "success" : "neutral"}
                  >
                    {home.isAvailable ? <span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full bg-emerald-400 ring-4 ring-emerald-100" /> : null}
                    {home.availabilityLabel}
                  </Badge>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5 lg:p-6">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                    <Badge className="!rounded-full !border-slate-200 !bg-slate-100 !text-slate-700" tone="neutral">
                      {home.programType === "sober_living" ? "Sober Living" : "Continued Care"}
                    </Badge>
                    {home.tags.map((tag) => <Badge key={tag} className="!rounded-full !border-slate-200 !bg-slate-100 !text-slate-700" tone="neutral">{tag}</Badge>)}
                    </div>
                    <h3 className="line-clamp-2 text-xl font-semibold leading-snug group-hover:text-primary">
                      {home.programName}
                    </h3>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin aria-hidden="true" className="shrink-0" size={16} />
                      {home.location}
                    </p>
                  </div>

                  <div className="mt-auto flex min-h-12 items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p>
                      {home.priceAmount ? <><span className="text-2xl font-bold tracking-tight">{home.priceAmount}</span><span className="text-sm text-muted-foreground">/week</span></> : <span className="text-sm font-semibold">Contact for pricing</span>}
                    </p>
                    <span className="shrink-0 text-sm font-semibold text-primary">View <span aria-hidden="true">→</span></span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {(["sober_living", "continued_care"] as const).map((type) => {
            const searchParams = new URLSearchParams(params);
            searchParams.set("type", type);
            return <Link key={type} className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-semibold shadow-sm hover:bg-muted" href={`/search?${searchParams.toString()}`}>
              View all {type === "sober_living" ? "sober living homes" : "continued care programs"}
            </Link>;
          })}
        </div>
      </div>
    </section>
  );
}
