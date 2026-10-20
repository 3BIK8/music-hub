# Music Hub: project context for AI coding agents

## What this is

A personal, single-user music app (no other users, never published). Music mostly comes from YouTube. Priorities in order: (1) very large library without duplicates or slowness, (2) responsive, polished UI on desktop and Android, (3) automatic playlists from available metadata, (4) very low mobile data use.
Stack: Node/Express (ESM), MongoDB/Mongoose, React (Create React App) in `client/`. Server entry: `server/server.js`.

## Risk note

Downloading from YouTube may violate its terms, and hosting copies may not be permitted. This is a personal experiment. Keep extraction and storage replaceable (behind modules), and tolerate files or sources disappearing. Never add features that distribute content to other people.

## Target architecture

- Phone: Android PWA. Library index in IndexedDB, audio cache, offline pinning, Wi-Fi-only preloading, Media Session.
- API: small Express app on Render free tier (sleeps when idle, temporary disk, changing IP). Never runs yt-dlp. Stores nothing on local disk. Token auth.
- Database: MongoDB Atlas M0 (free).
- Worker: Node script on the user's Windows PC. Polls the API/DB for jobs, runs yt-dlp and ffmpeg, stores the original locally, makes an Opus streaming copy (target 48-64 kbps), uploads it, marks the job done. If the PC is off, jobs just wait.
- Audio storage: Backblaze B2 (10 GB free, no card) behind `server/services/storage.service.js`. Phase 1-3 use a local-folder adapter. All audio URLs come from one `getUrl()` function.
- Backups: originals on the PC and a hard drive. Invariant: every cloud object can be regenerated from a local original.

## Data contract (initial, may be refined)

Song (one per YouTube video for now):

- source: {provider, sourceId} with a unique index
- title, artist, channel, duration, thumbnail key
- audio.original: {codec, bitrate, size, sha256} (path stays on the PC)
- audio.stream: {key, codec, bitrate, size, sha256, status: none|processing|ready|failed|unavailable}
- createdAt, updatedAt, deletedAt (soft delete)
  Job: songId, status (pending|processing|done|failed), attempts, maxAttempts, workerId, leaseExpiresAt, runAfter, lastError. Unique partial index: one active job per song.
  Claiming: one atomic findOneAndUpdate takes a job that is pending and due, or processing with an expired lease. Sets processing, workerId, lease (~10 min) and attempts+1. The worker extends the lease. After maxAttempts the job is failed, and a retry button resets it.
  Identity: YouTube videoId is authoritative. Do NOT auto-merge similar songs. Title/artist/duration matching only suggests possible duplicates for the user to confirm. Audio fingerprinting is deferred.

## Verified findings from the first audit (re-verify against code before acting)

- "Add to Queue" in AddSong.jsx only adds to the library, not PlayerContext.queue.
- playSongBySongId in PlayerContext.js returns early if the song isn't queued, so clicking library songs often does nothing.
- selectedPlaylist in App.js does not change what is displayed. Playlist fetching is duplicated (usePlaylists.js and PlaylistList.jsx).
- GET /songs returns the whole collection; search is client-side (useSearch.js). Playlists populate every song.
- Audio extraction runs in-process via setImmediate in songRoutes.js (not durable). Cloudinary and ytdl-core are being removed.
- Processing -> ready never updates in the UI without a refresh. Audio errors are silent.
- CSS is a fixed 3-column grid with no media queries. API URL is hard-coded.
- Root `dev` script was broken (`nodemon server.js`). No tests, no CI.

## Phases

0a baseline and CI -> 0b API hardening -> 1 queue/playback fixes -> 2 job queue + local worker + local storage -> 3 pagination/search/playlists -> 4 B2 adapter + Render deploy -> 5 responsive UI + data diet (measure first) -> 6 offline/PWA -> 7 history, smart playlists, Spotify import (metadata only, matches confirmed by the user).

## Working rules

- Work only on the task given. Keep changes small, incremental and testable. Do not refactor unrelated code or rewrite working code for style.
- Prefer the simplest design. No microservices, queues libraries, Redis, or heavy state libraries unless a measured need exists.
- Reuse existing dependencies and components. Preserve the current visual identity.
- Must work on Windows (the dev machine) and Linux (CI and Render). No shell-specific scripts; use Node scripts.
- Secrets only in environment variables. Never commit `.env`, keys or connection strings. Never put the API token in the client build.
- Do not use localStorage for anything except the user's API token and simple preferences.
- Verify claims against the code. State what is verified and what is assumed. Don't assume code works because it exists.
- Add or update tests for behavior you change. Run `npm run check`, `npm test` and `npm run build` before finishing. CI must pass.
- At the end of each task, list every file changed and any assumption or follow-up.

## Known open items

Render free-tier limits unverified; B2 behavior at the free limit unverified; queue persistence across refresh undecided (decide in Phase 1); auto-cache default (planned: on, ~1 GB cap, LRU, visible size, clear button, pinned tracks kept separate).
