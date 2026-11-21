# Design Reference

Visual specification for **OpenReel**, an original interface that follows the
2008–2010 YouTube layout language. Roughly 85% classic structure and styling,
15% refinement for legibility, focus states, and responsive behavior.

Nothing here reproduces a YouTube logo, screenshot, icon set, or other
protected asset. All marks and artwork are original.

## 1. Design principles

1. **The page is the product.** Dense, scannable, information-first. No hero
   sections, no empty space held for branding.
2. **Chrome recedes.** Gray rails, white content, thin borders. Hierarchy
   comes from weight and position, not color or shadow.
3. **Every pixel earns its place.** Metadata is compact and adjacent to the
   content it describes.
4. **Motion explains, never entertains.** Only short transitions on hover,
   progress, and disclosure. No parallax, no entrance animations.
5. **Usable, not just nostalgic.** 13px minimum body text, visible focus
   rings, 24px+ hit targets, real labels, responsive reflow.

## 2. Color tokens (`src/styles/retro.css`)

| Token | Value | Use |
|-------|-------|-----|
| `--page` | `#ffffff` | page and card background |
| `--chrome` | `#f2f2f2` | utility bar, nav bar, side boxes |
| `--chrome-dark` | `#e6e6e6` | module headers, table headers |
| `--border` | `#c9c9c9` | 1px separators, box outlines |
| `--border-soft` | `#e2e2e2` | inner dividers |
| `--text` | `#333333` | body copy |
| `--text-strong` | `#111111` | headings |
| `--muted` | `#666666` | metadata, timestamps, counts |
| `--link` | `#0033bb` | default and visited hyperlinks |
| `--link-hover` | `#cc0000` | hover underline accent |
| `--brand` | `#c4302b` | original wordmark accent, primary buttons |
| `--brand-dark` | `#8f1f1b` | button hover |
| `--ok` | `#2e6b2e` | success text |
| `--warn` | `#8a5a00` | warning text |
| `--focus` | `#ffbf47` | 2px keyboard focus outline |

Blue links are deliberately classic (`#0033bb`, underlined on hover only in
body copy, always underlined in prose blocks) so the page reads as 2009 rather
than as a modern app.

## 3. Typography

- Stack: `Verdana, Arial, Geneva, sans-serif` for chrome and metadata;
  `Arial, Helvetica, sans-serif` for headings. Both are system fonts, so no
  webfont request and no licensing question.
- Base size **13px**, line-height **1.45**.
- Page title (video title): 18px bold.
- Section/module heading: 12px bold, uppercase off, `--text-strong`.
- Metadata: 11px, `--muted`.
- Body copy in descriptions/comments: 12.5–13px.
- No letter-spacing tricks, no all-caps body text.

## 4. Layout grid

```
┌────────────────────────────────────────────────────────────┐
│ utility bar: wordmark · search · upload · account          │ 48px
├────────────────────────────────────────────────────────────┤
│ nav bar: Home Videos Subscriptions Channels Categories     │ 28px
├────────────────────────────────────────────────────────────┤
│ container 970px                                            │
│  ┌──────────────────────────────┐  ┌─────────────────────┐ │
│  │ main column (flex: 1)        │  │ rail 300px          │ │
│  └──────────────────────────────┘  └─────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ footer: 4 link columns + legal line                        │
└────────────────────────────────────────────────────────────┘
```

- Max width **970px** (the era's fixed width), centered, 12px gutters.
- Watch page main column **640px**, rail **300px**.
- Breakpoints: `≤ 1000px` rail moves below main; `≤ 640px` single column,
  search moves under the wordmark, grids become 2-up; `≤ 420px` 1-up list
  rows with larger tap targets.

## 5. Components

### Header
- White, 1px `--border` bottom. Wordmark is text-based: a red rounded
  rectangle containing "Open" with "Reel" in `--text-strong` beside it.
  Tagline "A video library you own." in 10px muted text (hidden on phones).
- Search: 300px (flex on phones), 1px inset `#b5b5b5` border, white field,
  gray `#eee` square button with a text "Search" label (not an unlabeled icon).
- Account area: `Sign in` / `Create account` links, or `Signed in as <name>`
  with `My channel` / `Sign out`. Upload is a bordered button in the nav row.

### Navigation
- Light-gray bar, 13px bold-ish links, 1px separators. Current section marked
  by darker text plus a 2px bottom border under the label — not a filled pill.
- Category dropdown-like link points to `/categories`.

### Video card
- 16:9 generated SVG thumbnail with 1px border; duration chip bottom-right
  (black 75% opacity, 10px bold white).
- Title: 13px bold, max two lines, underlined on hover.
- Meta line: 11px muted, `channel · 3 days ago · 1,204,551 views`.
- On grids, the whole card is one link target with the title as its accessible
  name; the channel name is a separate link where layout permits.
- No hover lift, no shadow, no overlay controls.

### Sidebar box
- 1px `--border`, `--chrome` header strip with bold 12px label and optional
  `see all` link, white body, 6px padding. Matches documented 2009 home and
  channel modules.

### Buttons
- Rectangular, 2px radius, 1px `#999` border, `#f0f0f0` fill, 12px bold,
  4px 10px padding. Primary action uses `--brand` fill with white text.
- Icon buttons always carry a text label (thumbs up/down include counts).

### Tabs
- Bottom-border tabs (`2px solid --brand` on the active tab) with 13px labels,
  horizontally scrollable on phones.

### Pagination
- `Previous | 1 | 2 | 3 | … | Next`, 1px separated cells, 24×22px minimum.
- Current page is bold with a light gray fill and `aria-current="page"`.

### Forms
- Labels above fields, 12px bold. Inputs: 1px `#b5b5b5` border, 3px padding,
  13px text, focus ring `--focus`.
- Errors: red text plus an icon-free bold prefix "Error:", associated with the
  field via `aria-describedby`.

## 6. Page compositions

### Home
Two columns: main = "Videos Being Watched Now" horizontal strip (4 cards) →
"Featured Videos" (1 large + 2 small, if data allows) → "Recently Uploaded"
grid with pagination. Rail = "Most Popular" (category list with top video per
category), "Subscription Updates" (5 rows), "What's New" (static site notes).
Above the main column, a one-line, dismissible "local preview" notice explains
the frontend-only state.

### Watch
640px player, title, byline row, action row (thumbs, Favorite, Share,
Playlists, Flag), description with `(more info)` disclosure, tags, comments.
Rail: channel box with subscribe, "More From" list, Related Videos, playlist
adder. No autoplay; a "Play all" button starts an explicit queue.

### Channel
Themed header band (channel color, diagonal texture), avatar + name + handle,
stats row, subscribe button, tabs (Videos / Playlists / Subscribers / About),
then newest-first grid.

### Search
Result count line, left refinement column (190px) with upload date, type, and
sort; results as horizontal rows (thumbnail 120px, title, snippet, meta).
Numbered pagination.

### Playlist
Two columns: playlist index on the left (create form + list with counts),
selected playlist on the right (rename/delete, ordered rows with reorder
controls, remove, play all, empty state).

### Upload
Two columns: drop zone + selected-file preview + progress on the left;
metadata form (title, description, category, tags, thumbnail choice) on the
right. A persistent notice states that no server upload occurs yet.

## 7. Accessibility requirements

- Semantic landmarks: `header`, `nav`, `main`, `aside`, `footer`; one `h1` per
  page; hidden skip link to `#main`.
- Keyboard: all controls reachable, `:focus-visible` rings, no focus traps,
  Escape closes the account menu.
- All form fields labelled; errors announced with `role="alert"`.
- Thumbnail links have accessible names from the video title, not "image".
- Color contrast ≥ 4.5:1 for text (`#333` on white, `#666` at 11px only for
  non-essential meta; counts also appear in titles/tooltips where needed).
- `prefers-reduced-motion` disables the strip's horizontal scroll animation.
- Live regions for upload progress (`role="progressbar"` with values) and toast
  messages (`aria-live="polite"`).

## 8. What we intentionally avoid

Rounded card stacks, glassmorphism, oversized type, full-bleed video heroes,
dark mode by default, gradient buttons, floating action buttons, skeleton
shimmer, sticky mini-players, and any layout whose primary job is to maximize
thumbnail impressions.
