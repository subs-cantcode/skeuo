# Skeuo Video

**Just videos. Like the old days.**

Skeuo Video is an open-source video library that looks and behaves like the web
did in 2008–2010: a dense homepage, a search box, channels, subscriptions,
numbered pages, and a watch page with comments and related videos.

It is the first application in the [Skeuo](https://github.com/subs-cantcode/skeuo)
project.

Skeuo Video is not a modern streaming app with retro colours. It is an
independent reimplementation of the era's *browsing model* — categories,
creators that you follow, chronological feeds, and pages that end. There is no
recommendation engine, no infinite scroll, no autoplaying feed, no advertising,
and no engagement ranking.

**Status: v0.2.0 (frontend, local-first).** Everything you can click works. Social
data lives in `localStorage`, imported video files live in IndexedDB, and there is
no server yet. Accounts and a shared backend remain future milestones; see
[docs/architecture.md](docs/architecture.md).

## What works today

- **Homepage** — "Videos Being Watched Now", featured videos, a paginated
  "Recently Uploaded" grid, Most Popular by category, subscription updates.
- **Search** (`/results`) — title, description, channel, category, and tag
  matching with relevance / newest / oldest / most-viewed sorting, a category
  filter, and numbered pagination. Every refinement is in the URL.
- **Watch page** — HTML5 playback, title, byline, likes/dislikes, share panel,
  `(more info)` description with category and tags, add-to-playlist, comments
  (post, delete your own, mark spam, sort), queue-aware playlist playback with
  autoplay-next **off** by default, and related videos chosen by
  channel/category/tag.
- **Channels** — themed channel header, avatar, bio, stats, subscribe toggle,
  and Videos / Playlists / Subscribers / About tabs.
- **My Videos** (`/my-videos`) — import your own files from disk, play them, edit
  titles and descriptions, and delete them. Files stay in this browser and are
  marked **Local — Only you**.
- **Channels index**, **Subscriptions** — strictly chronological feed grouped by
  day, **Browse**, **Category**, **Playlists**, **Upload**, **Sign in**, and
  **Not found** pages.

All navigation, pagination, and controls are functional.

The catalog has 25 entries in two kinds. **24 are fictional demonstration
entries**: the titles, descriptions, durations and view counts are invented, and
each one streams an openly licensed CC0 stand-in clip from MDN Web Docs in
rotation — every card and watch page says so. The 25th, `v-mdn-flower`, is a real
sample whose title and duration describe the footage that plays, and whose
thumbnail is a frame extracted from that same file. All other thumbnails are
generated SVG. See [THIRD_PARTY.md](THIRD_PARTY.md) and
[docs/sample-media.md](docs/sample-media.md).

## Personal video library (v0.2.0)

`/my-videos` is a local-first library: it imports video files straight from your
computer into this browser, with no account, database, or backend.

**What it does**

- Multi-select or drag several files at once; each is validated, measured, and
  given a 640×360 poster captured from its own first second.
- Titles default to the filename and can be edited, along with the description.
- Imported videos play on the normal watch page and use the classic card layout,
  marked **Local — Only you** on the thumbnail, on the card, and in search
  results.
- Deleting asks for confirmation, then removes the metadata, the file and the
  poster in one transaction.

**Supported formats** — MP4 (H.264/AAC), WebM, Ogg and QuickTime (`.mov`), matched
by MIME type or extension. The browser has the final say: a file it cannot decode
is rejected with a message instead of being added as a dead player. MP4 and WebM
are the formats that work everywhere.

**Limits** — 200 MB per file, the same ceiling as the simulated upload page.
Total capacity is the browser's storage quota for this origin (roughly 10 GB in
Chrome and Edge, considerably less in Safari), minus whatever the rest of the
site uses.

**Storage** — IndexedDB, database `skeuo.video.library`, with two stores: `videos`
for metadata and `media` for the file and poster blobs. IndexedDB keeps blobs on
disk natively and gives one transaction across metadata and bytes. The Origin
Private File System was considered and rejected: it has no index layer, reached
Firefox only in version 111, and would still need a separate manifest plus orphan
cleanup. Nothing is written to `localStorage`.

**Browser storage limitations**

- Data is per browser and per profile. Another browser, another profile, or a
  private window will not see the library.
- The browser may evict site data under storage pressure. The page reports whether
  storage is persistent and offers a button to request persistence; a grant is not
  guaranteed.
- Clearing site data, clearing browsing data, or uninstalling the browser deletes
  the library permanently. There is no server copy.
- Quota failures — predicted from `navigator.storage.estimate()` or raised during
  the write — are reported on the page and leave no half-written record.

**Importing and deleting**

1. Open **My Videos** in the top navigation.
2. Choose files, or drag them onto the drop zone. Progress is shown per file.
3. Wait for the card: it shows resolution, duration, size, and the captured frame.
4. **Edit details** changes the title and description; **Watch** opens the player.
5. **Delete** asks for confirmation, then removes the video from this browser.

**Privacy**

Imported files are never uploaded. There is no server, no analytics, and no
third-party request during import: the file is read, decoded, and drawn to a
canvas by the browser, then written to IndexedDB on this machine. The only
network traffic in the app is the sample catalog's MDN clips and the app's own
assets.

The guarantee has limits worth stating plainly: files are not encrypted, so
anyone with access to this browser profile can play them; browser extensions with
broad host permissions can read page storage; and a future backend or sync
feature would change this promise, at which point it must be restated here.

## Quick start

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle in dist/
npm test         # unit and component tests
npm run typecheck
```

No environment variables are required for Milestone 1. See
[.env.example](.env.example) for the variables later milestones will use.

## Architecture at a glance

| Layer | Choice | Why |
|-------|--------|-----|
| UI | React 18 + TypeScript | Component reuse without a component library |
| Routing | React Router 6 | URL-driven state; every page is linkable |
| Build | Vite | Fast dev server, small output, no config sprawl |
| Styling | Hand-written CSS (`src/styles/retro.css`) | The visual target is 2008-era CSS, not a utility framework |
| State | React context + localStorage | Enough for a single-user frontend; replaced by API calls later |
| Local library | IndexedDB (`skeuo.video.library`) | Blobs stored on disk, one transaction for metadata + bytes, no ~5 MB ceiling |
| Tests | Vitest + Testing Library | Behaviour-level tests for search, pagination, and routing |

Full design rationale, data flow, and the roadmap to a real backend are in
[docs/architecture.md](docs/architecture.md).

## Documentation

- [docs/historical-research.md](docs/historical-research.md) — what was observed
  in archived 2008–2010 pages, and what was inferred or decided.
- [docs/feature-analysis.md](docs/feature-analysis.md) — component-by-component
  comparison, including deliberate omissions.
- [docs/design-reference.md](docs/design-reference.md) — color tokens,
  typography, layout grid, components, and accessibility rules.
- [docs/architecture.md](docs/architecture.md) — code map, state model,
  trade-offs, and milestone plan.
- [THIRD_PARTY.md](THIRD_PARTY.md) — dependencies, sample media, and licensing.

## Deliberately absent

Shorts-style vertical feeds, livestreaming, AI assistants or summaries,
AI/engagement-driven recommendations, advertising or sponsorship, monetization,
premium tiers, infinite scrolling, autoplaying recommendation feeds, and
watch-time analytics.

## Roadmap

- **Backup and export** — export the library as one archive (video files plus a
  JSON manifest of titles, descriptions and import dates) and re-import it, so a
  browser change or a cleared profile does not mean losing the collection.
- **Import queue controls** — cancel a large import, retry one that failed, and
  show real byte progress rather than stage labels.
- **Poster choice** — capture several frames and let the user pick one, instead of
  a single frame at the one-second mark.
- **Accounts and sync** — Milestone 2 in [docs/architecture.md](docs/architecture.md).

## Contributing

Bug reports, accessibility fixes, and historical corrections are welcome. Read
[CONTRIBUTING.md](../../CONTRIBUTING.md) before opening a pull request.
