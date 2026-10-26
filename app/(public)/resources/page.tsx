import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing-header";
import { ButtonLink } from "@/components/ui/button-link";
import { FeaturedVideo } from "@/components/resources/featured-video";
import { ResourceBrowser } from "@/components/resources/resource-browser";
import { publicAppUrl } from "@/lib/app-urls";
import {
  resourcesPlaylistUrl,
  resourceVideos
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
          <ResourceBrowser videos={rest} />
        </section>
      </main>
    </>
  );
}
