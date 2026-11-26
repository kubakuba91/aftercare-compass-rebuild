import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing-header";
import { ButtonLink } from "@/components/ui/button-link";
import { FeaturedVideo } from "@/components/library/featured-video";
import { ResourceBrowser } from "@/components/library/resource-browser";
import { publicAppUrl } from "@/lib/app-urls";
import {
  resourcesPlaylistUrl,
  resourceVideos
} from "@/lib/resource-videos";

export const metadata: Metadata = {
  title: "Library | Aftercare Compass",
  description:
    "Short videos on recovery houses and sober living: what they are, where they came from, and how people find the right one after treatment."
};

export default function LibraryPage() {
  const [featured, ...rest] = resourceVideos;

  return (
    <>
      <MarketingHeader />
      <main className="overflow-hidden bg-white">
        <section className="ac-public-hero">
          <div className="shell relative grid items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
            <div className="max-w-3xl">
              <p className="ac-public-kicker">Library</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#17212b] sm:text-5xl lg:text-6xl">
                Library
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Learn how recovery housing works. Short videos that explain recovery houses in plain words: what they are,
                where they came from, and how people find the right one after treatment.
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
          <p className="ac-public-kicker">Videos</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#17212b] sm:text-4xl">More to watch</h2>
          <ResourceBrowser videos={rest} />
        </section>
      </main>
    </>
  );
}
