"use client";

import Image from "next/image";
import { useId, useMemo, useState } from "react";
import { ExternalLink, Play, Search } from "lucide-react";
import { TrackedLink } from "@/components/resources/tracked-link";
import {
  resourceTopics,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
  type ResourceVideo
} from "@/lib/resource-videos";

type View = "cards" | "library";

// Only published videos (lib/resource-videos.ts) are passed in; pending sync items never reach this component.
export function ResourceBrowser({ videos }: { videos: ResourceVideo[] }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("cards");
  const searchId = useId();
  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      q
        ? videos.filter((v) => [v.title, v.summary, ...v.topics].join(" ").toLowerCase().includes(q))
        : videos,
    [videos, q]
  );

  const tabClass = (active: boolean) =>
    `focus-ring rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? "bg-[#10195e] text-white" : "text-[#17212b] hover:bg-[#eef3fc]"
    }`;

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <label className="sr-only" htmlFor={searchId}>
            Search resources by topic
          </label>
          <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            className="focus-ring w-full rounded-full border border-border bg-white py-2.5 pl-10 pr-4 text-sm"
            id={searchId}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, like history or case managers"
            type="search"
            value={query}
          />
        </div>
        <div aria-label="Resource view" className="inline-flex rounded-full border border-border p-1" role="group">
          <button aria-pressed={view === "cards"} className={tabClass(view === "cards")} onClick={() => setView("cards")} type="button">
            Cards
          </button>
          <button aria-pressed={view === "library"} className={tabClass(view === "library")} onClick={() => setView("library")} type="button">
            Library
          </button>
        </div>
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
        {q ? `${filtered.length} ${filtered.length === 1 ? "video" : "videos"} match “${query.trim()}”` : `${videos.length} videos`}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          No videos match that yet. Try another word.
        </p>
      ) : view === "cards" ? (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <li key={video.id}>
              <TrackedLink
                aria-label={`${video.title} (opens YouTube in a new tab)`}
                className="focus-ring group block h-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:shadow-lg"
                eventName="resource_card_click"
                eventParams={{ video_id: video.id, video_title: video.title, view: "cards" }}
                href={youtubeWatchUrl(video.id)}
                rel="noopener noreferrer"
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
      ) : (
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {resourceTopics.map((topic) => {
            const inTopic = filtered.filter((v) => v.topics.includes(topic));
            if (inTopic.length === 0) return null;
            return (
              <section aria-labelledby={`topic-${topic}`} key={topic}>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-primary" id={`topic-${topic}`}>
                  {topic}
                </h3>
                <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
                  {inTopic.map((video) => (
                    <li key={video.id}>
                      <TrackedLink
                        aria-label={`${video.title} (opens YouTube in a new tab)`}
                        className="focus-ring block p-4 hover:bg-[#f4f8ff]"
                        eventName="resource_card_click"
                        eventParams={{ video_id: video.id, video_title: video.title, view: "library" }}
                        href={youtubeWatchUrl(video.id)}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <span className="font-semibold text-[#17212b]">{video.title}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{video.summary}</span>
                      </TrackedLink>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
