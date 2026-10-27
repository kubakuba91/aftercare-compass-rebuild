#!/usr/bin/env node
// Sync the Series A YouTube playlist into a REVIEW-ONLY pending file.
// Nothing here changes the live Resources page: published videos live in
// lib/resource-videos.ts and are only changed by a human (Michael/Kuba review
// every blurb). See docs/resources-playlist-sync.md.
//
// Default source: free playlist Atom RSS (no key). If YOUTUBE_API_KEY is set,
// uses YouTube Data API playlistItems.list instead (returns the full playlist,
// RSS only returns the latest ~15).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataFile = path.join(root, "lib/resource-videos.ts");
const pendingFile = path.join(root, "content/resources/pending-videos.json");

const src = await readFile(dataFile, "utf8");
const playlistId = process.env.RESOURCES_PLAYLIST_ID || src.match(/resourcesPlaylistId\s*=\s*"([^"]+)"/)?.[1];
if (!playlistId) throw new Error("Playlist id not found");
const published = new Set([...src.matchAll(/id:\s*"([A-Za-z0-9_-]{11})"/g)].map((m) => m[1]));

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

async function fromRss() {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`);
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: e.match(/<yt:videoId>([^<]+)/)?.[1],
    title: decode(e.match(/<title>([^<]*)/)?.[1] ?? ""),
    description: decode(e.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? ""),
    publishedAt: e.match(/<published>([^<]+)/)?.[1] ?? null
  }));
}

async function fromApi(key) {
  const out = [];
  let pageToken = "";
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.search = new URLSearchParams({ part: "snippet", maxResults: "50", playlistId, key, ...(pageToken && { pageToken }) });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API fetch failed: ${res.status}`);
    const json = await res.json();
    for (const it of json.items ?? []) {
      const s = it.snippet;
      out.push({ id: s.resourceId?.videoId, title: s.title, description: s.description ?? "", publishedAt: s.publishedAt });
    }
    pageToken = json.nextPageToken ?? "";
  } while (pageToken);
  return out;
}

const BANNED = /\b(free|price|pricing|cost|\$\d|IOP|PHP|intensive outpatient|partial hospitali[sz]ation)\b/i;
function draftSummary(title, description) {
  const first = description.split(/\n|(?<=[.!?])\s/).map((s) => s.trim()).find((s) => s.length > 20 && !BANNED.test(s) && !/https?:\/\//.test(s));
  const text = first ?? `A short video on ${title.replace(/[?.!]+$/, "").toLowerCase()}.`;
  return text.length > 160 ? text.slice(0, 157).trimEnd() + "..." : text;
}

const key = process.env.YOUTUBE_API_KEY;
const items = (key ? await fromApi(key) : await fromRss()).filter((v) => v.id && !/^(Private|Deleted) video$/.test(v.title));

let existing = { videos: [] };
try { existing = JSON.parse(await readFile(pendingFile, "utf8")); } catch {}
const prior = new Map((existing.videos ?? []).map((v) => [v.id, v]));

const fetchedAt = new Date().toISOString();
const pending = items.filter((v) => !published.has(v.id)).map((v) => prior.get(v.id) ?? {
  id: v.id,
  title: v.title,
  youtubeUrl: `https://www.youtube.com/watch?v=${v.id}&list=${playlistId}`,
  thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
  publishedAt: v.publishedAt,
  fetchedAt,
  draftSummary: draftSummary(v.title, v.description),
  status: "needs-review"
});

const body = { playlistId, source: key ? "youtube-data-api" : "rss", lastSyncedAt: fetchedAt, note: "Review-only. Not shown on the site until promoted into lib/resource-videos.ts.", videos: pending };
const changed = JSON.stringify(pending) !== JSON.stringify(existing.videos ?? []);
if (changed || !existing.lastSyncedAt) {
  await mkdir(path.dirname(pendingFile), { recursive: true });
  await writeFile(pendingFile, JSON.stringify(body, null, 2) + "\n");
}
console.log(`Playlist ${playlistId}: ${items.length} items, ${published.size} published, ${pending.length} pending review${changed ? " (updated)" : ""}.`);
