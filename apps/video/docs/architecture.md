# Architecture

This document explains how Milestone 1 is built, which decisions are deliberate,
and what Milestones 2–4 will change.

## 1. Scope and honesty

This is a **frontend-only** application. It is complete as a browsing experience:
every page, link, form, vote, comment, playlist and simulated upload works in the
browser. It is not a backend. There is no authentication, no shared database and
no transcoding. Since v0.2.0 there *is* media storage, but only in the visitor's
own browser: imported files are written to IndexedDB on the device and are never
uploaded.

The UI states this in five places: the homepage notice, the sign-in page, the
subscriptions gate, the upload page and My Videos. Mocked data is labelled as sample data
in the code that defines it (`src/data/*.ts`) and in this document.

## 2. Stack and why

| Choice | Rationale |
|--------|-----------|
| React 18 + TypeScript | The interface is a set of repeated modules (video cards, rails, forms). React models that cleanly and TypeScript keeps the data shapes honest. |
| React Router 6 | The era's sites were page-based and linkable. Routes and query strings preserve that: `?page=3`, `?sort=newest`, `?list=…`, `?tab=…`. |
| Vite | Minimal configuration, fast HMR, small static output. |
| Hand-written CSS | The target is a 2009 stylesheet: fixed 970px width, 1px borders, system fonts. A utility framework or component library would fight the design and add weight for no benefit. |
| No global state library | One context with a handful of setters is enough for single-user, client-only state. |
| Vitest + Testing Library | Pure logic is tested directly; navigation is tested through the real router. |

## 3. Code map

```
index.html
src/
  main.tsx                 React root, router, store provider
  App.tsx                  Route table (exported for tests)
  types.ts                 Domain types + the 15 era categories
  styles/retro.css         Design tokens and all component styles
  components/
    Layout.tsx             Skip link, header, nav, main, footer, toasts
    Header.tsx             Wordmark, global search, account menu
    NavBar.tsx             Primary navigation + upload
    Footer.tsx             Era-style link columns and disclaimer
    VideoCard.tsx          grid / row / compact / feature variants
    Thumbnail.tsx          Generated artwork, duration chip, Local badge
    Pagination.tsx         Numbered paging driven by the query string
    SortTabs.tsx           Tab strip above a listing
    SidebarBox.tsx         Bordered module with gray header strip
    SubscribeButton.tsx    Auth-aware subscribe toggle
    SignInPrompt.tsx       Sign-in wall for signed-out actions
    Avatar.tsx             Square initials avatar
    EmptyState.tsx         Reusable empty-state block
    ToastRegion.tsx        Polite live region for local actions
  pages/
    HomePage.tsx           Watching Now, Featured, Recent, rails
    SearchPage.tsx         Results + refinements
    BrowsePage.tsx         /videos and /categories
    CategoryPage.tsx       /videos/:category with sort tabs
    WatchPage.tsx          Player, byline, actions, description,
                           playlist adder, comments, related rail
    ChannelPage.tsx        Channel header, stats, four tabs
    ChannelsPage.tsx       Channel index
    SubscriptionsPage.tsx  Chronological feed grouped by day
    PlaylistsPage.tsx      Create/rename/delete/reorder/play all
    UploadPage.tsx         Local upload, validation, simulated pipeline
    MyVideosPage.tsx       Local library: import, play, edit, delete
    SignInPage.tsx         Local profile (not authentication)
    NotFoundPage.tsx       404
  lib/
    channel.ts             Name / tint fallbacks for a missing channel
    format.ts              Counts, dates, durations, relative time, plurals
    pagination.ts          Clamp-and-slice, page tokens, page parsing
    search.ts              Transparent scoring + sorting + pagination
    sort.ts                Newest / oldest / most-viewed comparators
    related.ts             Related / more-from selection
    stats.ts               Deterministic vote counts, day grouping
    thumbnails.ts          Deterministic SVG data URIs
    validate.ts            Upload rules shared with the UI copy
    library.ts             IndexedDB library, media probing, poster capture
    usePageTitle.ts        Per-route document titles
  data/
    channels.ts            Seven fictional channels
    videos.ts              24 fictional videos + sample media URLs
    comments.ts            Ten seeded comments
  store/
    AppStore.tsx           Context state and all mutations
    persistence.ts         Guarded localStorage access
    useLibrary.ts          Library state, import pipeline, object URLs
  test/setup.ts            jest-dom + jsdom shims
```

## 4. State model

```
profile        { name, handle } | null      local identity
subscriptions  string[]                     channel ids
votes          Record<videoId, up|down>     one vote per video
comments       Comment[]                    locally added comments
playlists      Playlist[]                   ordered video id lists
drafts         Video[]                      local uploads
toasts         transient UI feedback        not persisted
```

Everything except `toasts` is written to `localStorage` under
`openreel.state.v1`. Writes are guarded: if storage is unavailable (private
mode, quota), the app keeps working in memory.

Imported videos are **not** part of that JSON. `lib/library.ts` keeps them in
IndexedDB (`skeuo.video.library`): metadata in a `videos` store, the file and
poster blobs in a `media` store, so editing a title never rewrites video bytes.
`useLibrary` turns each record into a `Video` with object URLs and merges it into
the same list the rest of the app reads, which is why cards, search and the watch
page need no parallel code path. Object URLs are revoked on delete and on
unmount; the bytes stay on disk and are re-exposed on the next load.

Derived values are computed on read rather than stored: seeded comments are
merged with local ones, drafts are prepended to the catalog, channels include
the signed-in profile's own channel, and vote counts come from a stable hash of
the video id plus the visitor's own vote.

Two consequences worth stating:

- **Object URLs do not survive a reload.** A saved draft keeps its metadata but
  loses its `blob:` source; the watch page explains this instead of showing a
  broken player. `readState` strips stale blob URLs on load.
- **Seeded comments are constants.** Marking them as spam is refused with a
  toast rather than pretending to persist a change.

## 5. Search and related videos

Search is intentionally explainable. `lib/search.ts` scores each video by
counting query terms in, in descending weight: exact title, title, channel name,
tags, category, description; ties break on view count. Sorts are applied after
filtering, then pagination. No history, profile or popularity decay is involved.

Related videos use fixed rules: same channel (+8), same category (+4), shared
tags (up to +4), then view count. The rail states that it is not based on what
you watched.

Subscriptions are a filter plus a date sort. There is no ranking step to disable,
because none exists.

## 6. Routing and URL state

| Route | Page |
|-------|------|
| `/` | Homepage (`?page=`) |
| `/results` | Search (`?q=&sort=&category=&page=`) |
| `/videos`, `/categories` | Browse (category index + recent) |
| `/videos/:category` | Category listing (`?sort=&page=`) |
| `/watch/:id` | Watch page (`?list=` for a playlist queue) |
| `/channel/:id` | Channel (`?tab=`) |
| `/channels` | Channel index |
| `/subscriptions` | Chronological feed |
| `/playlists` | Playlist management (`?list=`, `?add=`) |
| `/upload` | Upload (simulated) |
| `/my-videos` | Personal library (import, edit, delete) |
| `/signin` | Local profile (`?next=`, `?mode=register`) |
| `*` | Not found |

Every list keeps its state in the URL, so results are shareable and browser
back/forward work. Pagination clamps out-of-range pages instead of showing an
empty screen.

## 7. Accessibility decisions

- Semantic landmarks with one `h1` per page and a skip link.
- Visible `:focus-visible` outlines using a dedicated focus token.
- All controls are native elements: buttons, links, inputs, `details`/`summary`.
  No custom dropdowns, no focus traps.
- Decorative thumbnails use empty alt text; the surrounding link carries the
  video title as its accessible name.
- Vote buttons expose `aria-pressed`; the active pagination cell carries
  `aria-current="page"`.
- Progress uses `role="progressbar"` with live values; toasts use a polite live
  region.
- Direction findings such as 11px muted metadata are kept at AA contrast, and
  `prefers-reduced-motion` disables transitions.

## 8. Deliberate trade-offs

- **No CSS modules or Tailwind.** One stylesheet with tokens is easier to audit
  against the design reference and mirrors the era's approach.
- **No optimistic API layer.** There is no API yet, so inventing client-side
  loading/retry machinery would be speculative.
- **No service worker or offline cache.** Not requested; would add stale-data
  problems before a backend exists.
- **Simulated upload.** A real upload needs server validation, streaming,
  FFmpeg transcoding and storage; faking a server would violate the brief's
  honesty rule. The page says exactly what is simulated.
- **No authorisation model in the client.** Hiding buttons is not security. It
  arrives with the server in Milestone 2.

## 9. Roadmap

### v0.2.0 — personal video library (done)

- Import local files into IndexedDB, capture a poster frame with canvas in the
  browser, edit title/description, delete with confirmation. No server, no
  account, no network request carrying file bytes.
- Files are private to the browser profile and labelled **Local — Only you** on
  the thumbnail, the card, the watch page and in search results.
- 200 MB per file; quota is the browser's for this origin.
- **Backup and export is deliberately deferred.** It needs a container decision
  (one archive vs. loose files) and an import path that validates a manifest
  before writing anything. Listed here so it is not mistaken for done.

### Milestone 2 — data and accounts

- Node.js + TypeScript API (Fastify), PostgreSQL with Drizzle or Prisma.
- Session-cookie authentication (httpOnly, SameSite, rotating tokens), password
  hashing with argon2/bcrypt.
- Tables: users, channels, videos, subscriptions, comments, votes, playlists,
  playlist_items, reports.
- Replace `AppStore` persistence with API calls; keep the same component
  contracts so pages barely change.
- Server-side authorisation for every mutation; pagination in SQL.

### Milestone 3 — uploads and playback

- Multipart upload to local disk in development, S3-compatible storage in
  production.
- FFmpeg probe/transcode to H.264/AAC MP4 plus a WebM derivative; HLS for long
  videos.
- Thumbnail extraction at several timestamps; poster selection.
- Job states (`uploaded → validating → transcode → ready/failed`) surfaced in
  the UI; uploaded files are private until `ready`.
- Range requests and CDN-friendly cache headers.

### Milestone 4 — deployment readiness

- Rate limiting per IP and account, upload quotas, MIME sniffing and file
  signature checks.
- Moderation queue, copyright/takedown workflow, audit logging.
- Security headers, CSRF protection, dependency scanning, backups.
- Deployment documentation and a staging environment.

## 10. Research process

Historical observations were taken from dated Internet Archive captures of
public pages, read at normal page level. The REA skill is installed in
`.agents/skills/reverse-engineer-anything`; it targets shipped artifacts and
live runtime observation, neither of which exists for a 2009 website whose
servers are gone. Its MCP server was not registered in this environment and its
CLI requires a newer Node.js than the host provides, so no REA analysis was
run. Nothing in this repository comes from YouTube source code, private
endpoints or copied assets. See `docs/historical-research.md` for the source
list and the Observed / Inferred / Decided tagging used throughout.
