# Sample media sources and verification record

This file records the openly licensed media used by the demo catalog: the source,
its licence, how its thumbnail was produced, and what was actually verified.

## What the catalog contains

25 entries, in two kinds:

| Kind | Count | Metadata | Playback | Thumbnail |
|------|-------|----------|----------|-----------|
| Fictional demonstration entries (`demo: true`) | 24 | Invented titles, descriptions, durations, view counts and dates | `flower.mp4` / `friday.mp4` in rotation | Generated SVG artwork |
| Real sample (`v-mdn-flower`) | 1 | Describes the footage; duration measured at 5 s | `flower.mp4` | Real extracted frame |

The 24 demonstration entries are labelled in the interface — "Demo entry —
fictional title and metadata" on cards, and a notice on the watch page — and the
watch page lists the stand-in clip under **Playback**. Nothing about those entries
claims to be footage of its title.

## The real sample

| Field | Value |
|-------|-------|
| Catalog id | `v-mdn-flower` |
| Title | Flower opening in a garden bed |
| Playback URL | `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4` |
| Source | MDN Web Docs interactive-examples sample media (CC0 video collection) |
| Licence | CC0 1.0 Universal (public domain dedication) |
| Attribution line | MDN Web Docs sample media / CC0 1.0 (Mozilla) |
| Duration | 5 s (measured: 5.055 s) |
| Thumbnail | `public/thumbnails/flower.webp` (real extracted frame, 640×360) |

CC0 requires no attribution; the line is kept for transparency and shown on the
watch page. The fictional channels remain demonstration profiles and do not
represent the creators of any footage.

## How a thumbnail is chosen

- A video shows a real frame **only** when that frame was extracted from that
  video's own source file after playback was verified here.
- Every other entry uses the generated SVG artwork from `src/lib/thumbnails.ts`.
- `Thumbnail` swaps to that artwork at runtime if a frame image fails to load, and
  the watch page probes its poster once and does the same, so neither a card nor a
  player shows a broken image.

## Extraction method

`scripts/extract-thumbnail.mjs`:

1. Serves the local video file from a throwaway `127.0.0.1` HTTP server, so the
   canvas stays same-origin and `toDataURL` is not blocked by canvas tainting.
   The server honours single `Range` requests (`206` with `Content-Range`), so a
   media element can seek normally.
2. Loads it in a `<video>` element and requires the playback bar first:
   `readyState >= 3`, a finite positive `duration`, and a clock that advances after
   `play()`. If that fails, it exits non-zero and writes no image.
3. Seeks to the requested timestamp, draws the frame into a 640×360 canvas, and
   encodes WebP with Chromium's own canvas encoder (quality 0.82). The canvas
   context and the decoded frame dimensions are validated before drawing.

No FFmpeg and no extra image dependency are required. The output directory is
created only after a frame has been encoded successfully, so a failed run leaves
nothing behind.

### Prerequisites (Windows, macOS, Linux)

- Node.js 18 or newer and npm.
- The app's dependencies installed: `npm install` inside `apps/video`.
- A Playwright Chromium build for the version pinned in `devDependencies`:

  ```powershell
  npx playwright install chromium
  ```

- The source video downloaded locally. In PowerShell (deliberately kept out of
  version control):

  ```powershell
  New-Item -ItemType Directory -Force .tmp-media | Out-Null
  Invoke-WebRequest -Uri "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" -OutFile ".tmp-media\flower.mp4"
  ```

  In bash (Git Bash, WSL, macOS, Linux):

  ```bash
  mkdir -p .tmp-media
  curl -fL -o .tmp-media/flower.mp4 \
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  ```

### Run it

From `apps/video` (paths are relative to the app directory — none are hardcoded
in the script):

```powershell
node scripts/extract-thumbnail.mjs .tmp-media/flower.mp4 public/thumbnails/flower.webp 3
```

```bash
node scripts/extract-thumbnail.mjs .tmp-media/flower.mp4 public/thumbnails/flower.webp 3
```

Arguments: input video, output image, and the optional timestamp in seconds
(default 3). Choose a timestamp where the subject is visible, not a fade or title
card.

### Expected output

```json
{
  "output": "<app>/public/thumbnails/flower.webp",
  "bytes": 16458,
  "width": 640,
  "height": 360,
  "source": "960x540",
  "duration": 5.05,
  "frameAt": 3,
  "readyState": 4,
  "clockAdvanced": true
}
```

Check `width`/`height` (16:9), a reasonable `bytes` value, and `readyState: 4`.
Open the image and confirm it shows the subject rather than a blank or black frame.

### Failure handling

| Symptom | Cause | What to do |
|---------|-------|------------|
| `missing input video: …` | Wrong path or failed download | Re-check the path relative to `apps/video` |
| `invalid timestamp: …` | Non-numeric or negative time argument | Pass seconds, e.g. `3` or `2.5` |
| `extraction failed: metadata timeout` | File never loaded | Confirm the file plays in a browser; confirm the extension is `.mp4`, `.webm` or `.ogv` |
| `extraction failed: media error` | Corrupt or unsupported codec | Re-download, or transcode to H.264 MP4 |
| `playback bar not met: readyState=…` | Chromium cannot decode this source | Transcode to MP4/H.264, or keep the generated SVG fallback for that entry |
| `playback clock did not advance` | Autoplay/decode stalled | Retry once; if it repeats, treat the source as unplayable here |
| `decoded frame has no dimensions` | Frame not actually decoded | Retry; treat the source as unplayable if it repeats |
| `canvas 2d context unavailable` | Headless build without a 2D context | Update Playwright (`npx playwright install chromium`) |
| `seek timeout` | Seeking past a sparse keyframe region | Pick an earlier timestamp |
| `canvas did not encode WebP` | Chromium build lacks the WebP encoder | Update Playwright |
| `browserType.launch: Executable doesn't exist` | Chromium not installed | Run `npx playwright install chromium` |

On any failure the script writes no image, so a failed run can never leave a
misleading thumbnail behind. If extraction is impossible for a source, the entry
keeps the generated SVG fallback and must not claim a real frame.

## Verification results

### Playback

- `flower.mp4` (the exact catalog URL): `readyState` 4, `duration` 5.055 s,
  `960×540`, clock advanced after `play()`, no media error.
- `friday.mp4`: loads over HTTPS, plays, finite duration, audible track.
- `<source>` no longer declares `type="video/mp4"`, so the browser selects a
  source it can actually decode instead of rejecting a non-MP4 container on a
  wrong MIME. The earlier Commons `.ogv`/`.webm` entries failed with
  `networkState 3` (no usable source) and were removed rather than shipped dead.

### Thumbnail

- `public/thumbnails/flower.webp` — 640×360, 16,458 bytes, WebP quality 0.82,
  frame at 3.0 s (open red flower); visually inspected, a real frame.
- Cards and the watch-page poster both resolve it and both fall back to generated
  SVG when the request fails (verified by pointing an image at a missing path).
- The catalog uses an absolute `/thumbnails/flower.webp` path. A relative path
  resolved to `/watch/thumbnails/flower.webp` on a deep-linked watch page and
  returned the SPA fallback HTML, leaving an empty poster.
- The production build copies the file to `dist/thumbnails/flower.webp`, where it
  serves as `image/webp`.

## Record of the earlier multi-video pass

Kept so the evidence survives the cleanup of that pass's probe scripts and
screenshots. Nothing below is claimed as verified catalog media.

- **Wikimedia Commons batch (not verified):** the Commons originals for the
  cookies, Barcelona street-music and EIDAN subway clips, plus their 480p VP9
  transcoded derivatives, never reached the playback bar in this Chromium build.
  Probes stalled at `readyState 0 / networkState 1 / duration null`. The
  transcoded derivative URL pattern observed was
  `/wikipedia/commons/transcoded/<hash-prefix>/<file>/<file>.480p.vp9.webm`.
- **Commons rate limiting:** repeated requests returned HTTP 429 ("Too many
  requests — contact noc@wikimedia.org"). Probes were backed off and stopped
  rather than retried in a loop. Six screenshots that captured that error page
  instead of a video frame were deleted during cleanup; they were byte-identical
  error pages, not footage.
- **Internet Archive home movies:** two genuine frames were captured from the
  Clark family MP4s (`castaoca_000159`, `castaoca_000126`). They were never
  integrated and were deleted as unreferenced leftovers. They can be regenerated
  with `scripts/extract-thumbnail.mjs` against
  `https://archive.org/download/castaoca_000159/castaoca_000159_access.HD.mp4` and
  `https://archive.org/download/castaoca_000126/castaoca_000126_access.HD.mp4` if
  those entries are taken up again.
- **Rejected:** the USCC Doukhor Internet Archive item (CC BY-ND plus additional
  restrictions), and any candidate without a clear licence, attribution and
  reachable playback URL.
