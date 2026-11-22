# Third-party components and media

All application code, interface design, branding and copy in this repository are
original to Skeuo Video. The following third-party works are used under their own
licences.

## Runtime dependencies

| Package | Version | Licence | Use |
|---------|---------|---------|-----|
| `react` | 18.3.1 | MIT | UI rendering |
| `react-dom` | 18.3.1 | MIT | DOM renderer |
| `react-router-dom` | 6.26.2 | MIT | Client-side routing |

## Development dependencies

| Package | Licence | Use |
|---------|---------|-----|
| `typescript` | Apache-2.0 | Type checking |
| `vite`, `@vitejs/plugin-react` | MIT | Dev server and production build |
| `vitest` | MIT | Unit tests |
| `jsdom` | MIT | DOM environment for tests |
| `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` | MIT | Component tests |
| `@playwright/test` | Apache-2.0 | Chromium, Firefox and WebKit playback/layout regression tests; Chromium thumbnail extraction |
| `@types/react`, `@types/react-dom` | MIT | Type definitions |

No UI framework, icon pack, webfont or CSS library is used. Typography relies on
system fonts (Verdana, Arial, Geneva), so no font files are shipped.

## What the catalog actually contains

The catalog has **25 entries**, in two clearly different kinds:

| Kind | Count | Metadata | Playback |
|------|-------|----------|----------|
| Fictional demonstration entries (`demo: true`) | 24 | Invented titles, descriptions, durations, view counts and dates | One of two CC0 stand-in clips, assigned in rotation |
| Real sample (`v-mdn-flower`) | 1 | Describes the footage that actually plays; duration measured | The same clip the thumbnail was extracted from |

Every demonstration entry is labelled in the interface ("Demo entry — fictional
title and metadata" on cards, a notice on the watch page), and the watch page
names the stand-in clip under **Playback**. A demonstration entry's thumbnail and
duration describe the fictional video, never the stand-in footage.

## Sample playback media

Two openly licensed clips from MDN's CC0 example media are the only playback
sources in the catalog. Both were checked on 2026-11-21: each loads over HTTPS,
plays in Chromium, and reports a finite duration.

| Clip | Source | Licence | Used by |
|------|--------|---------|---------|
| Flower | `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4` | CC0 1.0 | 12 demonstration entries (alternating), and `v-mdn-flower` |
| Friday | `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4` | CC0 1.0 | 12 demonstration entries (alternating) |

CC0 1.0 requires no attribution. The catalog and the watch page still name the
source for transparency.

### Media removed after testing

These were tried and are **not** part of the catalog or the repository:

| Candidate | Reason |
|-----------|--------|
| `upload.wikimedia.org/…/Baking_cookies.ogv` | Theora `.ogv`; Chromium never reached `readyState >= 3`, and the player reported `networkState 3` (no usable source) |
| `upload.wikimedia.org/…/Music_in_the_street,_Barcelona_01.webm` and the 480p VP9 transcode | Probes stalled at `readyState 0`, `networkState 1`, `duration null` |
| `upload.wikimedia.org/…/EIDAN_500_-_Buenos_Aires_Subway_-_B_line.webm` | Same failure as above |
| `archive.org/download/castaoca_000159/…` and `castaoca_000126/…` (Clark Family, Public Domain Mark 1.0) | Reachable and decodable, but not needed once the catalog returned to the two verified clips; no file or frame is retained |
| `test-videos.co.uk` Big Buck Bunny encode | Carried no audio track |
| Blender trailers on `media.w3.org` | Rejected by Chromium with `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` |

Do not re-add media without checking that it loads, plays and reports a duration
in the target browser. A source that fails to decode must be removed, not shipped
with a mismatched `type` attribute.

Catalog playback media is remote. Two CC0 Flower test fixtures are committed
under `qa/fixtures`: `flower.mp4` and `flower.webm` from MDN's same
`media/cc0-videos/` collection. They make upload/import and player tests
independent of external media availability; they are not additional catalog
entries. See [the fixture source notes](qa/fixtures/README.md).
If you fork this project for a public deployment, host your own openly licensed
media or your own uploads. Do not add commercial or unlicensed video files.

## Thumbnails

| Kind | Count | Where it comes from |
|------|-------|---------------------|
| Generated SVG artwork | 24 | `src/lib/thumbnails.ts`, deterministic from `thumbSeed` and the channel tint |
| Real extracted frame | 1 | `public/thumbnails/flower.webp` — a frame of `flower.mp4` at 3.0 s, 640×360, 16,458 bytes |

The single real frame is from the same CC0 file that `v-mdn-flower` plays, so it
depicts its own playback source. No frame is claimed for a fictional entry, and
no stock photography or third-party artwork is included.

The frame was produced with `scripts/extract-thumbnail.mjs` (Playwright Chromium
plus a canvas WebP encoder); the method, prerequisites and failure handling are
documented in [docs/sample-media.md](docs/sample-media.md). At runtime
`Thumbnail.tsx` and the watch-page poster both fall back to the generated SVG if
an image request fails, so no card or player shows a broken image.

## Branding

"Skeuo" and "Skeuo Video", their wordmarks and the interface design are
original to this project. The project is not affiliated with, endorsed by, or
connected to YouTube, Google, or any other video platform. No YouTube logo,
trademark, screenshot, icon set or proprietary code is reproduced here.
