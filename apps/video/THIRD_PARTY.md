# Third-party components and media

All application code, interface design, thumbnails, branding and copy in this
repository are original to Skeuo Video. The following third-party works are used
under their own licences.

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
| `@types/react`, `@types/react-dom` | MIT | Type definitions |

No UI framework, icon pack, webfont or CSS library is used. Typography relies on
system fonts (Verdana, Arial, Geneva), so no font files are shipped.

## Sample playback media

The demo catalog streams two openly licensed sample clips in rotation, from
MDN's CC0 example media. Both were checked on 2026-11-21: each loads over
HTTPS, plays in Chromium and carries an audible audio track.

| Clip | Source | Licence |
|------|--------|---------|
| Flower | `interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4` | CC0 |
| Friday | `interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4` | CC0 |

Two earlier clips were dropped after testing: a Big Buck Bunny encode on
`test-videos.co.uk` had no audio track (playback was silent), and the Blender
trailers on `media.w3.org` were rejected by Chromium with
`ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`, leaving a dead player. Do not
re-add media without checking that it loads, plays and has audio.

These are stand-ins for playback only. The titles, durations and view counts in
`src/data/videos.ts` describe fictional videos, not these clips. They are loaded
over HTTPS from their original hosts; no media files are committed here.

If you fork this project for a public deployment, host your own openly licensed
media or your own uploads. Do not add commercial or copyrighted video files to
the repository.

## Thumbnails

Every thumbnail is an SVG generated at runtime by `src/lib/thumbnails.ts` from a
numeric seed and the channel's tint. No frame grabs, stock photography or
third-party artwork are included.

## Branding

"Skeuo" and "Skeuo Video", their wordmarks and the interface design are
original to this project. The project is not affiliated with, endorsed by, or
connected to YouTube, Google, or any other video platform. No YouTube logo,
trademark, screenshot, icon set or proprietary code is reproduced here.
