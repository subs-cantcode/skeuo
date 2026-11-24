# Feature Analysis

Component-by-component analysis of the 2008–2010 YouTube experience, plus what
this project implements in Milestone 1 and why. Evidence levels (`Observed`,
`Inferred`, `Decided`) are defined in `docs/historical-research.md`.

Scope rule from the brief: this is a video **library**, not an engagement
platform. Anything whose only purpose is to increase session length is out.

## 1. Homepage

| Aspect | Historical | This project |
|--------|-----------|--------------|
| Structure | **Observed:** rotating "Videos Being Watched Now", then Featured, Most Popular (by category), Most Viewed, Top Favorited, What's New | Featured strip, "Videos Being Watched Now" rail, paginated "Recently Uploaded" grid, Most Popular by category, subscription updates |
| Customization | **Observed:** per-module edit / close / "Want to customize this homepage?" | Not in Milestone 1. Deferred; no drag-and-drop theatre added. |
| Density | **Observed:** compact 4-up thumbnails with duration chips, "Added", view counts, uploader links | Same density, modernized only with slightly larger hit targets and visible focus rings |
| Paging | **Observed:** modules had `(view all)`; listing pages paginated | Numbered pagination on the main grid, no infinite scroll |

**Decided:** keep the module stack column-based instead of the original
nested-float soup, so the page reflows predictably on narrow screens. On
phones the rail moves below the main column.

## 2. Header and navigation

- **Observed:** two rows — utility (locale, Sign Up, QuickList, Help, Sign In)
  and primary (Home Videos Shows Channels Community + Upload).
- **Decided:** one utility row (brand, search, account links) and one primary
  nav row with Home / Videos / My Videos / Subscriptions / Channels / Playlists + Upload.
  `QuickList` is replaced by `Playlists`, because that is the feature this app
  actually has and it matches the era's "queue" idea. Category browsing lives
  within Videos; legacy `/categories` URLs redirect there.
- Search lives in the header on every page, as observed. It is a real form
  that navigates to `/results`.

## 3. Search

- **Inferred:** left refinement column (upload date, result type, sort),
  `About N results`, numbered pagination.
- **Decided:** query matches title, description, channel name, category and
  tags — the brief's requirement. Sorts: relevance (title/description match
  weighting), newest, oldest, most viewed. Empty query and zero-result states
  are explicit, with suggestions. Refinements are URL-driven so results are
  shareable and back/forward works.

## 4. Video thumbnails

- **Observed:** 4:3-ish frame, black duration chip, title, uploader, age,
  views, "Added" label.
- **Decided:** thumbnails are generated locally as deterministic SVG art
  (no scraped or copyrighted frames). Duration chip stays. Metadata order:
  duration → title → uploader → age → views. Hover underlines the title only;
  no zoom, no overlay autoplay preview.

## 5. Watch page

- **Observed:** title, byline, `(more info)`, description, category, tags,
  ratings row, view count, Favorite/Share/Playlists/Flag, More From (play
  all / autoplay toggle), Related Videos rail, comments with Show/Hide,
  spam marking, Reply, pagination, video responses.
- **Decided:**
  - HTML5 `<video>` with `controls` and a generated poster. Sample clips are
    openly licensed stand-ins (see `THIRD_PARTY.md`); catalog durations are
    fictional metadata, so the player's real length can differ.
  - Likes/dislikes replace the five-star widget (brief requirement; YouTube
    moved to thumbs in 2010). One vote per signed-in visitor, stored locally.
  - "Autoplay next" defaults **off** and only ever advances within an explicit
    queue (a playlist). It never auto-plays recommended content.
  - "More From" and Related Videos are computed from category/channel/tags, no
    ranking model.
  - Comments: chronological or newest-first (user choice), mark-as-spam and
    reply are implemented locally; edit/delete own comments supported.
  - Video responses, statistics tables, and the QuickList carousel are out of
    scope (documented, not faked).

## 6. Channel page

- **Observed:** avatar, name, bio, `Style:` theme, Joined/Last Sign In/Videos
  Watched/Subscribers/Channel Views, country/website, honors, subscriber
  boxes, activity feed, Videos / Most Viewed / Most Discussed tabs.
- **Decided:** channel header with a CSS theme color derived from the channel
  record (era-style solid/pattern background, not a modern hero banner),
  avatar, bio, stats, subscribe button, tabs (Videos / Playlists / Subscribers
  / About), newest-first grid. "Honors" replaced by honest totals. Custom
  theme colors are user-editable in Milestone 2.

## 7. Subscriptions

- **Observed:** `Subscriptions` appeared in the 2009 nav and channel boxes.
- **Decided:** a single chronological list, newest first, with no
  recommendations, no "because you watched", and no sponsored slots. Grouping
  is by day. Empty state explains how to subscribe and links to channels.

## 8. Related videos

- **Observed:** right-rail list with views/uploader.
- **Decided:** deterministic scoring by shared category, shared channel, tag
  overlap, and recency, with the score explained in a tooltip? No — no hidden
  ranking. Simple ordered rules: same channel → same category → tag matches →
  popular. The list is capped at 12 and paginated? No, 12 is enough.

## 9. Categories

- **Observed:** 15 categories under `Categories` (Autos & Vehicles … Travel &
  Events) plus Shows/Movies/Trailers/Contests/Events.
- **Decided:** adopt the 15 video categories exactly (they are generic
  vocabulary, not protectable branding). Exclude the Shows/Movies commerce
  surfaces. `/videos/:category` lists per-category videos with the same sort
  tabs as search.

## 10. Pagination

- **Observed:** numbered pages with `Previous | 1 | 2 | 3 | Next`.
- **Decided:** one reusable `Pagination` component (page size 12 on grids,
  10 in search) used everywhere. Page in the query string (`?page=2`) so
  links are shareable; out-of-range pages clamp with a visible notice.

## 11. Playlists

- **Observed:** `Playlists` action on the watch page and a `QuickList` queue.
- **Decided:** first-class playlists: create, rename, delete, add/remove
  videos, reorder (move up/down and drag-free controls for keyboard and touch
  users), play all in order. Persisted locally in Milestone 1.

## 12. Upload workflow

- **Observed:** auth-gated (`303 → /login?next=/my_videos_upload`), and the
  site offered file upload plus webcam recording.
- **Inferred:** single file chooser, metadata form, processing screen.
- **Decided (Milestone 1):** client-side only. File picker + drag/drop,
  validation of MIME type and size, local object-URL preview, metadata form
  (title, description, category, tags, thumbnail choice from three generated
  frames), progress bar driven by a simulated pipeline, then a clearly
  labelled "local draft" that appears in your library. There is **no server**
  yet, and the page says so. Webcam recording is out of scope.

## 13. Deliberately absent

Shorts, livestreaming, AI assistants/summaries, AI recommendations,
advertising, sponsorship, monetization, premium tiers, infinite scroll,
autoplaying recommendation feeds, engagement ranking, notifications designed
to pull users back, and watch-time analytics.

## 14. Milestone status

| Capability | Status |
|-----------|--------|
| Frontend routes and navigation | Done (Milestone 1) |
| Search, sort, pagination | Done (client-side over mock data) |
| HTML5 playback, comments, votes, playlists, subscriptions | Done, persisted in `localStorage` and labelled as local |
| Accounts, database, real video storage, transcoding | Not started (Milestone 2–3) |
| Moderation, rate limits, deployment hardening | Not started (Milestone 4) |

Nothing in the UI claims a server exists where it does not.
