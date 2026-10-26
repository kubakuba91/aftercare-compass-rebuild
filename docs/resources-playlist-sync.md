# Resources playlist sync

The Series A playlist (`PLb9ZWqN6f9YU`) is the source of truth for the Resources page. Channel-only videos (IOP, PHP, "What is Aftercare Compass?") are never pulled in.

- **Published (live):** `lib/resource-videos.ts`. Only these appear on `/resources`.
- **Pending (review only):** `content/resources/pending-videos.json`. Written by the sync, never read by the site.

## Run locally
    npm run sync:resources-playlist
Uses free playlist RSS by default (latest ~15 items). Set `YOUTUBE_API_KEY` to use YouTube Data API `playlistItems.list` (full playlist).

## Review / promote
Michael or Kuba must review every blurb before it goes live.
1. Open `pending-videos.json`, read the `draftSummary` (plain language; no pricing/"free" claims, no IOP/PHP jargon).
2. Copy approved entries into `resourceVideos` in `lib/resource-videos.ts` as `{ id, title, summary, topics }` (topics drive the Library view and search) with the reviewed summary.
3. Re-run the sync; promoted videos drop out of pending.

## Schedule
`docs/workflows/sync-resources-playlist.yml` (template; copy to `.github/workflows/` with a token that has `workflow` scope or via the GitHub web UI) runs Mondays 13:00 UTC and on manual dispatch. It checks out `michael-grok-bot-testing`, runs the sync, and if pending changed pushes `bot/resources-playlist-sync` and opens a PR into `michael-grok-bot-testing`. It never pushes to `main` and never merges. Setup: optional repo secret `YOUTUBE_API_KEY`; repo setting "Allow GitHub Actions to create pull requests" must be on. The workflow file must exist on the default branch for the schedule to fire.
