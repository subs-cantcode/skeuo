# Sample media sources and verification record

This file records the openly licensed sample media used by the demo catalog: the
source, its license, how its thumbnail was produced, and what was actually verified.

## Scope

One implemented feature: a catalog entry can carry a genuine frame extracted from its
own video, with the generated SVG artwork kept as the fallback. The multi-video research
pass was not continued here.

## Implemented entry

| Field | Value |
|-------|-------|
| Catalog id | `v-mdn-flower` |
| Title | Flower opening in a garden bed |
| Playback URL | `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4` |
| Source | MDN Web Docs interactive-examples sample media (CC0 video collection) |
| License | CC0 1.0 Universal (public domain dedication), as published by MDN in its `cc0-videos` collection |
| Attribution line | MDN Web Docs sample media / CC0 1.0 (Mozilla) |
| Thumbnail | `public/thumbnails/flower.webp` (real extracted frame, 640×360) |

CC0 requires no attribution; the line above is kept for transparency, matching the
other catalog entries. Fictional channels remain demonstration profiles and do not
represent the creators of the underlying footage.

## How a thumbnail is chosen

- A video shows a real frame **only** when that frame was extracted from that video's
  own source file after playback was verified here.
- Every other entry uses the generated SVG artwork from `src/lib/thumbnails.ts`.
- `Thumbnail` also swaps to that artwork at runtime if a frame image fails to load, so a
  card never shows a broken image.

## Extraction method

The thumbnail is a real frame from the same MP4 the entry plays — not stock imagery and
not a generated approximation.

`scripts/extract-thumbnail.mjs`:

1. Serves the local video file from a throwaway `127.0.0.1` HTTP server, so the canvas
   stays same-origin and `toDataURL` is not blocked by canvas tainting.
2. Loads it in a `<video>` element and requires the playback bar first: `readyState >= 3`,
   a finite positive `duration`, and a clock that advances after `play()`. If that fails,
   it exits non-zero and writes no image.
3. Seeks to the requested timestamp, draws the frame into a 640×360 canvas, and encodes
   WebP with Chromium's own canvas encoder (quality 0.82).

No FFmpeg and no extra image dependency are required.

### Prerequisites (Windows, macOS, Linux)

- Node.js 18 or newer and npm.
- The app's dependencies installed: `npm install` inside `apps/video`.
- A Playwright Chromium build for the version pinned in `devDependencies`. Install it once:

  ```powershell
  npx playwright install chromium
  ```

- The source video downloaded locally. The script reads a local file path, so fetch the
  clip first. In PowerShell (the file is deliberately kept out of version control):

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

From `apps/video` (paths are relative to the app directory — no absolute paths are
required, and none are hardcoded in the script):

```powershell
# PowerShell
node scripts/extract-thumbnail.mjs .tmp-media/flower.mp4 public/thumbnails/flower.webp 3
```

```bash
# bash
node scripts/extract-thumbnail.mjs .tmp-media/flower.mp4 public/thumbnails/flower.webp 3
```

Arguments: input video, output image, and the optional timestamp in seconds (default 3).
Choose a timestamp where the subject is visible and representative, not a fade or title
card.

### Expected output

The script prints one JSON summary and exits 0, for example:

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

Check `width`/`height` (16:9), a reasonable `bytes` value, and `readyState: 4`. Open the
image and confirm it shows the subject rather than a blank or black frame.

### Failure handling

| Symptom | Cause | What to do |
|---------|-------|------------|
| `missing input video: …` | Wrong path or download failed | Re-check the path relative to `apps/video`; download the clip again |
| `extraction failed: metadata timeout` | File never loaded | Confirm the file plays in a browser; confirm the extension is `.mp4`, `.webm` or `.ogv` |
| `extraction failed: media error` | Corrupt or unsupported codec | Re-download, or transcode the clip to H.264 MP4 |
| `playback bar not met: readyState=…` | Chromium cannot decode this source | Transcode to MP4/H.264, or keep the generated SVG fallback for that entry |
| `playback clock did not advance` | Autoplay/decode stalled | Retry once; if it repeats, treat the source as unplayable here |
| `seek timeout` | Seeking past a sparse keyframe region | Pick an earlier timestamp |
| `canvas did not encode WebP` | Chromium build lacks the WebP encoder | Update Playwright (`npx playwright install chromium`) |
| `browserType.launch: Executable doesn't exist` | Chromium not installed | Run `npx playwright install chromium` |

On any failure the script writes no image, so a failed run can never leave a misleading
thumbnail behind. If extraction is impossible for a source, the catalog keeps the
generated SVG fallback and the entry must not claim a real frame.

## Verification results

### Playback (the exact catalog URL)

Verified in the Chromium build that produced the frame:

- `readyState` = 4 (`HAVE_ENOUGH_DATA`)
- `duration` = 5.055 s (finite and non-zero)
- playback clock advanced after `play()`
- no media error event
- source is H.264/AAC MP4, which the app's `<source type="video/mp4">` plays directly

### Thumbnail

- Output: `public/thumbnails/flower.webp`
- Dimensions: 640×360 (16:9; the card box is 320×180 at 2× density)
- Size: 16,458 bytes (~16 KB), WebP quality 0.82
- Frame at 3.0 s — the open red flower, representative of the clip
- Visually inspected after extraction; a real frame, not blank or black

### Application

- Card images and the watch-page `poster` resolve to `/thumbnails/flower.webp`; both fall
  back to the generated SVG artwork if the image fails.
- The production build copies the file to `dist/thumbnails/flower.webp`, where it serves
  as `image/webp`.
- `npm run typecheck`, `npm test`, `npm run build` pass; see the change report for the
  exact counts.

## Record of the earlier multi-video pass

Kept here so the evidence survives the cleanup of that pass's probe scripts and
screenshots. Those temporary files were removed; nothing below is claimed as verified
catalog media.

- **Wikimedia Commons batch (not verified):** the Commons originals for the cookies,
  Barcelona street-music and EIDAN subway clips, plus their 480p VP9 transcoded
  derivatives, never reached the playback bar in this Chromium build. Probes stalled at
  `readyState 0 / networkState 1 / duration null`, so no frame was extracted and those
  entries keep generated thumbnails. The transcoded derivative URL pattern observed was
  `/wikipedia/commons/transcoded/<hash-prefix>/<file>/<file>.480p.vp9.webm`.
- **Commons rate limiting:** repeated requests returned HTTP 429 ("Too many requests —
  contact noc@wikimedia.org"). Probes were backed off and stopped rather than retried in
  a loop. Six screenshots that captured that error page instead of a video frame were
  deleted during cleanup; they were byte-identical error pages, not footage.
- **Internet Archive home movies:** two genuine frames were captured from the Clark
  family MP4s during that pass (`castaoca_000159`, `castaoca_000126`). They were never
  integrated, and the files were deleted as unreferenced leftovers. They can be
  regenerated with `scripts/extract-thumbnail.mjs` against
  `https://archive.org/download/castaoca_000159/castaoca_000159_access.HD.mp4` and
  `https://archive.org/download/castaoca_000126/castaoca_000126_access.HD.mp4` if those
  entries are taken up again.
- **Rejected:** the USCC Doukhor Internet Archive item (CC BY-ND plus additional
  restrictions), and any candidate without a clear license, attribution and reachable
  playback URL.

## Other catalog entries

The five other entries keep their playback URLs, titles, attribution and generated SVG
thumbnails. Their Commons and Internet Archive playback was not confirmed in this
Chromium build, so no frame thumbnail is claimed for them.
