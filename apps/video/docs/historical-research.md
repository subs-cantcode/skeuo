# Historical Research: YouTube, 2008–2010

This document records what we actually observed about the 2008–2010 YouTube
interface, what we inferred, and what we merely decided. Every claim below is
tagged with an evidence level:

- **Observed** — read directly from a dated Internet Archive capture of the
  public page (quoted text in this document came from those captures).
- **Inferred** — a plausible reconstruction from observed fragments plus
  general knowledge of late-2000s web UI. Not verified.
- **Decided** — a product/design choice for this project, not a claim about
  YouTube.

No proprietary source code, backend implementation, visual asset, or trademark
was copied. Captures were read as a member of the public, at normal page level.

## 1. Research method and REA

### 1.1 Environment inspection

- Node.js 24.18.0, npm 11.16.0, pnpm 12.18.0, git 2.55.0. FFmpeg is **not**
  installed on this machine; it is required only from Milestone 3.
- REA (`morluto/rea`, skill `reverse-engineer-anything`, v63) was installed
  into this repository at `.agents/skills/reverse-engineer-anything`.
- REA's MCP server is **not registered** in the agent session, so no
  `open_binary` / `capture_browser_scenario` / `list_browser_targets` tools
  were available.
- The documented CLI fallback (`npx -y rea-agents@latest`) **refused to run**:
  it requires Node.js 22.x ≥ 22.23.4, 24.x ≥ 24.22.1, or 26.12.1+, and this
  host has 24.18.0. That is a hard version gate, not a configuration error.

### 1.2 What REA can and cannot do here

REA is a *shipped-artifact and runtime-observation* tool: ASAR/Electron trees,
native binaries, APKs, archives, HAR/SAZ captures, and browser scenarios
against a target the operator supplies. The 2009 YouTube frontend is not a
shipped artifact we possess, and its servers are long gone. REA's own guidance
says to skip REA for ordinary source/repository analysis and to use normal
tools when no artifact exists. Therefore this phase used public, archived
pages — the same evidence class REA's browser-capture workflow would produce,
minus the live target.

Anything below labelled **Observed** is a page-level observation, not recovered
source code. We did not attempt to bypass authentication, DRM, or access
controls, and we did not extract private endpoints or proprietary code.

### 1.3 Sources

| # | Source | Capture date |
|---|--------|--------------|
| S1 | `web.archive.org/web/20090601101732/http://www.youtube.com/` | 2009-06-01 |
| S2 | `web.archive.org/web/20090605191143/http://www.youtube.com/watch?v=9lp0IWv8QZY` | 2009-06-05 |
| S3 | `web.archive.org/web/20090531215329/http://www.youtube.com/user/failblog` | 2009-05-31 |
| S4 | `web.archive.org/web/20091114033336/http://www.youtube.com/videos` | 2009-11-14 |
| S5 | `web.archive.org/web/20090702075636/http://www.youtube.com/my_videos_upload` | 2009-07-02 (redirected to `login?next=/my_videos_upload`) |

A search-results capture could not be located for 2009 (the nearest archived
snapshot is from 2013 and shows a later design, so it was discarded). Search
layout below is therefore **Inferred**, and the 2013 snapshot itself was used
only to confirm that pagination and sort controls existed in that era's
lineage — not as evidence for 2009 styling.

## 2. Global shell (S1, S2, S3, S4)

**Observed (S1, June 2009).** Utility row: `Worldwide`, `English`, `Sign Up`,
`QuickList (0)`, `Help`, `Sign In`. Primary navigation beneath it:
`Home  Videos  Shows  Channels  Community` and a distinct `Upload` entry with
an upload menu offering `Upload Video File` and `Record from Webcam`.

**Observed (S4, November 2009).** The nav has become
`Home  Videos  Channels  Shows  Categories`, with the utility row now
`Create Account or Sign In`, `QuickList (0)`, `Subscriptions`, `History`,
`Upload`, plus an inline locale/language selector. This shows the shell was
still moving during the target window; the project adopts the mid-2009
variant and adds `Subscriptions` because this app has a subscriptions page.

**Observed.** Pages end in a dense multi-column footer with a generic-column
heading (`YouTube`), then three link columns: `Programs`, `Help`, `Legal`, then
`Discover`, `Contact Us`, `Advertising`; the legal/help block includes
`Terms of Service`, `Privacy Policy`, `Community Guidelines`, `Copyright
Notices`, `Safety Center`, `Developers`, `Press Room`, `TestTube`, and a
`(c) 2009` line. The site title is `YouTube - Broadcast Yourself.`

**Observed.** Pages are table/float based, fixed-width, and use a white page
background with light-gray chrome, 1px gray separators, and a compact type
scale. There is no hero imagery, no card shadow system, and no rounded
"pill" navigation.

## 3. Homepage (S1)

**Observed structure, in document order:**

1. Utility row and primary nav (section 2).
2. `Videos Being Watched Now` block with a `(view all)` link and an inline
   `edit` / `Editing: Videos Being Watched Now` / `close` affordance, plus the
   line `Rotating videos in 10 seconds...`. Four items were rendered as
   screenshot thumbnails with `1:34`-style duration, title, view count, and
   uploader. That block rotates by timer.
3. `Featured Videos` block. Items carry a `[TRANSLATED]` marker when a
   translated title/description existed, `Added`, duration, title (truncated),
   description snippet, relative age (`1 week ago`), view count, uploader.
4. A customization prompt repeated on each module:
   `Want to customize this homepage? Sign In or Sign Up now!` with
   `Editing: <module>` / `close` / `Saving...` strings — i.e. each home module
   is user-arrangeable.
5. `Most Popular` with `(view all)`, grouped by category in sequence:
   `Entertainment`, `Music`, `News & Politics`, `Film & Animation`, `Sports`,
   `Howto & Style`, `People & Blogs`, `Gaming`. Each group lists a ranked
   video with duration, title, views, uploader.
6. `Most Viewed` and `Top Favorited` blocks (single highlight items in this
   capture).
7. `What's New` list of editorial/blog items (`Insight Data Now Exportable`,
   `Shows and Movies`, `YouTube Slam Dunk Finalists`) with a `Read more in our
   Blog` link.
8. Dense footer.

**Key observed detail:** items were labelled `Added` rather than "uploaded";
counts used comma separators (`42,949 views`); uploader names appeared as
plain blue links; thumbnails were 4:3-ish with a black duration chip in the
corner; the `Most Popular` rail exposed *categories* as the browsing axis
rather than personalization.

## 4. Video watch page (S2)

**Observed, top to bottom:**

- Title as an `<h1>`-style line, e.g. `Susan Boyle - Singer - Britains Got
  Talent 2009 (With Lyrics)`, with a `YouTube Announcement` slot above it and
  `Subscribe` / `Unsubscribe` buttons beside the channel identity.
- Player area with an `Annotations` toggle. A Flash-upgrade notice:
  `Upgrade to Flash Player 10 for improved playback performance.`
- Byline block: uploader name, `April 11, 2009`, and `(more info)` / `(less
  info)` disclosure controls.
- Description body with inline `http://www.youtube.com/watc...` shortlinks,
  then `Category:` and a `Tags:` list of individual linked words plus
  machine tags such as `yt:stretch=16:9`, `yt:quality=high`.
- `More From: BritainsSoTalented` with `Loading...`, `Play All`,
  `Stop Autoplaying`, `|`, `Play Next`, `Play Next`, `QuickList (0)`, a
  numbered strip `1`, `Clear |`, `Save`. This is the "more from this user"
  carousel that auto-advanced.
- `Related Videos` in the right rail, mixed with a `Featured Videos` block and
  explicit `Added` / duration / view count / uploader rows.
- `300,310 ratings`, a star-rating widget and `Sign in to rate`.
- `66,493,464 views`.
- Action row: `Favorite`, `Share`, `Playlists`, `Flag`, then `(more share
  options)` / `fewer share options` with a long list of era social targets
  (`MySpace`, `Facebook`, `Twitter`, `Digg`, `orkut`, `Live Spaces`, `Bebo`,
  `hi5`) and inline validation copy (`This video will appear on your blog
  shortly.`, `Thank you for sharing this video!`).
- `Also Watching Now (1)` and `Statistics & Data`.
- `Video Responses (740)` with `Added` rows and `View All` / `Play All`.
- Comments: `Sign in to post a Comment`, heading `Text Comments (308,323)`
  with an `Options` control, then chronological comment rows with username,
  `(8 seconds ago)` relative timestamp, `Show` / `Hide`, a small numeric
  rating counter (`0`), `Marked as spam`, and `Reply`. Footer of the block:
  `Next`, `Pages: 1 2 3 ...`, `View all 308,323 comments`, and
  `Would you like to comment? Join YouTube for a free account, or sign in if
  you are already a member.`

**Notable for implementation:** the 2009 page had **five-star ratings**, not
thumbs up/down. This project's brief explicitly asks for like/dislike, so the
UI keeps the era's compact action row but implements thumbs up/down (a
capability YouTube itself added in 2010). This is a **Decided** deviation and
is called out in `docs/feature-analysis.md`.

## 5. Channel page (S3)

**Observed:**

- Header row of channel tabs: `Videos | Subscribers | Subscriptions` above the
  channel content, with `Subscribe` / `Unsubscribe` on the right.
- `failblog's Channel` heading; the sign-in prompt `Want to Subscribe? Sign In
  or Sign Up now!`.
- `Style: Black` — a per-channel theme/background selector.
- Metadata list: `Joined: June 17, 2008`, `Last Sign In: 1 day ago`,
  `Videos Watched: 7,256`, `Subscribers: 255,598`,
  `Channel Views: 9,919,137`.
- Free-text biography block, then `Country: United States`,
  `Website: http://failblog.org`.
- Honors list of rankings, e.g. `#28 - Most Subscribed (All Time)`,
  `#9 - Most Viewed (Today)`, `#1 - Most Viewed (Today) - Comedians`, with
  `(more)` / `(less)`.
- `Report profile image violation`, `Connect with failblog`,
  `Send Message`, `Share Channel`, `Add to iGoogle`, and a raw embed snippet
  for the channel gadget.
- `Recent Activity` feed: `failblog uploaded a new video (2 days ago)` plus
  expandable description with `more` / `less`.
- `Subscriptions (2)` and `Subscribers (255598)` boxes with avatars and a
  `see all` link.
- A highlighted recent video (`Kick Fail`) with `From:`, `Views:`,
  `Comments:`.
- `Videos (343)` with sub-tabs `Videos | Most Viewed | Most Discussed` and a
  grid of `Added` / duration / `[TRANSLATED]` title / relative date / views /
  uploader rows.
- `Report background graphic.`

**Observed takeaway:** the era's channel page was a *bio + stats + activity
page* with background-image customization (`Style: Black`), not a modern
banner header with a trailer.

## 6. Videos browse / categories (S4)

**Observed:** `Videos` page with a left column of sort entries —
`Popular`, `Most Viewed`, `HD`, `more` — then `Spotlight Videos`,
`Rising Videos`, `Most Discussed`, `Recent Videos`, `Most Responded`,
`Top Favorited`, `Top Rated`, `As Seen On`. A `When:` control with `Today`,
`This Week`, `This Month`. An `In: All Categories` label and a category list:

`Autos & Vehicles, Comedy, Education, Entertainment, Film & Animation,
Gaming, Howto & Style, Music, News & Politics, Nonprofits & Activism,
People & Blogs, Pets & Animals, Science & Technology, Sports, Travel & Events`
plus `Shows, Movies, Trailers, Contests, Events`.

**Observed listing row format:** duration, title, one-line description
snippet, view count, uploader, category, absolute date (`November 12, 2009`),
and an `Added to Quicklist` action. Results mixed user videos with `Shows`
entries.

## 7. Upload flow (S5)

**Observed:** `/my_videos_upload` returned HTTP 303 to
`/login?next=/my_videos_upload` when not authenticated. The homepage upload
menu offered `Upload Video File` and `Record from Webcam`.

**Inferred:** the authenticated upload screen used a single-file browse
control, then title/description/tags/category/broadcast-options fields, then a
processing screen; uploads were transcoded to Flash video. We did not observe
the authenticated form, so this project's upload page is a documented
reconstruction, not a reproduction.

## 8. Search (Inferred)

No 2009 search capture was available. The era is well known for: a results
count line (`About N results`), a left-hand refinement column (upload date,
result type, duration, features), a `Sort by` control with
`Relevance / Upload date / View count / Rating`, and numbered pagination
`Previous | 1 | 2 | 3 ... Next`. This project implements that structure, with
the brief's requested sorts, and labels it as inferred design in
`docs/feature-analysis.md`.

## 9. What we deliberately did not reproduce

- YouTube's logo, wordmark, or any screenshot/thumbnail imagery.
- The Flash player, `yt:` machine tags, webcam recording, channel gadget
  embeds, MySpace-era share targets, and `TestTube`.
- Engagement machinery the brief excludes (autoplay of unrelated videos,
  recommendation feeds, infinite scroll).
- The 2013+ visual language, even where newer captures were easier to fetch.

## 10. Verification ledger

| Claim | Evidence | Confidence |
|-------|----------|------------|
| Utility row + 5-item nav in mid-2009 | S1 | Observed |
| Home modules are user-customizable | S1 | Observed |
| Home lists "Most Popular" per category | S1 | Observed |
| Watch page uses 5-star ratings in 2009 | S2 | Observed |
| Watch page comments paginate, with Reply/spam | S2 | Observed |
| Channel page has Videos/Subscribers/Subscriptions tabs and `Style:` theme | S3 | Observed |
| Channel page shows Joined/Last Sign In/Videos Watched/Channel Views | S3 | Observed |
| Category taxonomy (15 categories) | S4 | Observed |
| Video listing row format and Quicklist action | S4 | Observed |
| Upload requires auth and redirects to login | S5 | Observed |
| Upload form field order and progress UI | — | Inferred |
| Search refinement column and sort labels | — | Inferred |
| Exact pixel sizes, colors, fonts | — | Decided (approximated) |
