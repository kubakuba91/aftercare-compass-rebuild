"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { youtubeEmbedUrl, youtubeThumbnailUrl, type ResourceVideo } from "@/lib/resource-videos";
import { trackEvent } from "@/lib/track-event";

export function FeaturedVideo({ video }: { video: ResourceVideo }) {
  const [active, setActive] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-[#cddcf4] bg-[#10195e] shadow-[0_24px_70px_rgba(23,33,43,0.18)]">
      {active ? (
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          referrerPolicy="strict-origin-when-cross-origin"
          src={youtubeEmbedUrl(video.id)}
          title={`Video: ${video.title} (YouTube player, captions on)`}
        />
      ) : (
        <button
          aria-label={`Play video: ${video.title}`}
          className="focus-ring group absolute inset-0 h-full w-full"
          onClick={() => {
            trackEvent("resource_featured_play", { video_id: video.id, video_title: video.title });
            setActive(true);
          }}
          type="button"
        >
          <Image
            alt=""
            className="object-cover"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            src={youtubeThumbnailUrl(video.id)}
            unoptimized
          />
          <span className="absolute inset-0 grid place-items-center bg-black/15 transition group-hover:bg-black/30">
            <span className="grid size-20 place-items-center rounded-full bg-white text-[#10195e] shadow-xl transition group-hover:scale-105">
              <Play aria-hidden="true" className="ml-1" fill="currentColor" size={30} />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
