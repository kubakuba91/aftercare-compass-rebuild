import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink, Play } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { ButtonLink } from "@/components/ui/button-link";
import { FeaturedVideo } from "@/components/resources/featured-video";
import { TrackedLink } from "@/components/resources/tracked-link";
import { publicAppUrl } from "@/lib/app-urls";
import {
  resourcesPlaylistUrl,
  resourceVideos,
  youtubeThumbnailUrl,
  youtubeWatchUrl
} from "@/lib/resource-videos";

export const metadata: Metadata = {
  title: "Resources | Aftercare Compass",
  description:
    "Short videos on recovery houses and sober living: what they are, where they came from, and how people find the right one after treatment."
};

export default function ResourcesPage() {
  const [featured, ...rest] = resourceVideos;

  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="relative border-b border-border bg-[#f4f8ff]">
          <div className="pointer-events-none absolute -right-32 -top-44 size-[34rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="shell relative grid items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Resources</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl lg:text-6xl">
                Learn how recovery housing works.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Short videos that explain recovery houses in plain words: what they are, where they came from, and how
                people find the right one after treatment.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={publicAppUrl("/search")}>Find a recovery house</ButtonLink>
                <ButtonLink href={resourcesPlaylistUrl} variant="secondary">
                  Watch the full playlist on YouTube
                </ButtonLink>
              </div>
            </div>

            <figure>
              <FeaturedVideo video={featured} />
              <figcaption className="mt-3 text-center text-sm text-muted-foreground">{featured.title}</figcaption>
            </figure>
          </div>
        </section>

        <section className="shell py-20 lg:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Videos</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">More to watch</h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((video) => (
              <li key={video.id}>
                <TrackedLink
                  aria-label={`${video.title} (opens YouTube in a new tab)`}
                  className="focus-ring group block h-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:shadow-lg"
                  href={youtubeWatchUrl(video.id)}
                  rel="noopener noreferrer"
                  eventName="resource_card_click"
                  eventParams={{ video_id: video.id, video_title: video.title }}
                  target="_blank"
                >
                  <div className="relative aspect-video bg-[#10195e]">
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      src={youtubeThumbnailUrl(video.id)}
                      unoptimized
                    />
                    <div className="absolute inset-0 grid place-items-center bg-black/10 transition group-hover:bg-black/25">
                      <span className="grid size-14 place-items-center rounded-full bg-white text-[#10195e] shadow-xl">
                        <Play aria-hidden="true" className="ml-1" fill="currentColor" size={22} />
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="flex items-start justify-between gap-3 text-lg font-semibold text-[#17212b] group-hover:text-primary">
                      {video.title}
                      <ExternalLink aria-hidden="true" className="mt-1 shrink-0 text-muted-foreground" size={16} />
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{video.summary}</p>
                  </div>
                </TrackedLink>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
