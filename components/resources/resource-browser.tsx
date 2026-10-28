"use client";

import Image from "next/image";
import { useId, useMemo, useState } from "react";
import { ExternalLink, Play, Search } from "lucide-react";
import { trackEvent } from "@/lib/track-event";
import {
  resourceTopics,
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
  type ResourceVideo
} from "@/lib/resource-videos";

type View = "cards" | "library";

function InlinePlayer({ video, onClose }: { video: ResourceVideo; onClose: () => void }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#10195e]">
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
        referrerPolicy="strict-origin-when-cross-origin"
        src={youtubeEmbedUrl(video.id)}
        title={`Video: ${video.title} (YouTube player, captions on)`}
      />
      <div className="absolute right-2 top-2 z-10 flex gap-2">
        <a
          className="focus-ring rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white hover:bg-black/80"
          href={youtubeWatchUrl(video.id)}
          rel="noopener noreferrer"
          target="_blank"
        >
          YouTube
          <ExternalLink aria-hidden="true" className="ml-1 inline" size={12} />
        </a>
        <button
          aria-label={`Close video: ${video.title}`}
          className="focus-ring rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white hover:bg-black/80"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Only published videos (lib/resource-videos.ts) are passed in; pending sync items never reach this component.
export function ResourceBrowser({ videos }: { videos: ResourceVideo[] }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("cards");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const searchId = useId();
  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      q
        ? videos.filter((v) => [v.title, v.summary, ...v.topics].join(" ").toLowerCase().includes(q))
        : videos,
    [videos, q]
  );

  const play = (video: ResourceVideo, viewName: View) => {
    trackEvent("resource_card_click", { video_id: video.id, video_title: video.title, view: viewName });
    setPlayingId(video.id);
  };

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
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            // type=text avoids the browser’s native search magnifier overlapping our icon.
            // !pl/pr beat globals.css padding-inline on inputs (specificity wins over utilities).
            className="focus-ring w-full rounded-full border border-border bg-white py-2.5 !pl-11 !pr-4 text-sm [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
            id={searchId}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, like history or case managers"
            role="searchbox"
            type="text"
            value={query}
          />
        </div>
        <div aria-label="Resource view" className="inline-flex rounded-full border border-border p-1" role="group">
          <button aria-pressed={view === "cards"} className={tabClass(view === "cards")} onClick={() => setView("cards")} type="button">
            Cards
          </button>
          <button
            aria-pressed={view === "library"}
            className={tabClass(view === "library")}
            onClick={() => setView("library")}
            type="button"
          >
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
              <article className="h-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:shadow-lg">
                {playingId === video.id ? (
                  <InlinePlayer onClose={() => setPlayingId(null)} video={video} />
                ) : (
                  <button
                    aria-label={`Play video: ${video.title}`}
                    className="focus-ring group relative block aspect-video w-full bg-[#10195e]"
                    onClick={() => play(video, "cards")}
                    type="button"
                  >
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      src={youtubeThumbnailUrl(video.id)}
                      unoptimized
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/10 transition group-hover:bg-black/25">
                      <span className="grid size-14 place-items-center rounded-full bg-white text-[#10195e] shadow-xl">
                        <Play aria-hidden="true" className="ml-1" fill="currentColor" size={22} />
                      </span>
                    </span>
                  </button>
                )}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-[#17212b]">{video.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{video.summary}</p>
                </div>
              </article>
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
                      {playingId === video.id ? (
                        <div className="p-3">
                          <InlinePlayer onClose={() => setPlayingId(null)} video={video} />
                          <p className="mt-2 px-1 text-sm font-semibold text-[#17212b]">{video.title}</p>
                        </div>
                      ) : (
                        <button
                          aria-label={`Play video: ${video.title}`}
                          className="focus-ring block w-full p-4 text-left hover:bg-[#f4f8ff]"
                          onClick={() => play(video, "library")}
                          type="button"
                        >
                          <span className="font-semibold text-[#17212b]">{video.title}</span>
                          <span className="mt-1 block text-sm text-muted-foreground">{video.summary}</span>
                        </button>
                      )}
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
