# Mobile title/metadata overlap investigation

Status: **candidate rail containment and duplicate-upload fixes implemented;
actual iPhone acceptance pending**. The thumbnail-over-text symptom is reported
on the device but has not been reproduced in this Windows WebKit build. The
duplicate-upload and long-local-filename overflow defects were reproduced.

## Follow-up: signed-in local video rails

The reported location is `More From: Nabus`, for the local clip titled
`just flexing my abs hehehe :)`. This is the signed-in Upload path (`me` channel),
distinct from the My Videos library (`library` channel). The previous fixture
suite did not exercise actual file input, upload completion, or captured image
Blobs. `qa/local-rail.e2e.ts` now does so with an openly licensed fixture file,
the exact reported title, a long title, and an unbroken title.

Changes:

- Compact cards and Related rows use a nonshrinking thumbnail link whose width,
  maximum width and flex basis all equal the existing responsive thumbnail
  token. The inner image fills this link; overflowing media cannot cover the
  independently flexible text body. Text remains in normal block flow with
  automatic heights and wrapping. Existing 80px mobile / 96px desktop thumbnail
  widths, 8px gaps, fonts and colors are preserved.
- Upload completion previously scheduled a timeout inside `setProgress`'s
  updater. React Strict Mode can replay that updater; a real-file reproduction
  produced four stored drafts from three uploads. Completion now runs outside
  the updater, submission has a synchronous guard, timers are cancelled on
  unmount, and ids use UUIDs with a fallback. This reproduces a development-mode
  duplicate cause; it does not establish that Strict Mode caused the screenshot
  in the production-built preview.
- Related and More From additionally collapse local entries sharing an actual
  Blob source and exclude aliases of the current clip. They do not collapse
  distinct files just because titles match, or demo clips sharing sample URLs.
  No stored user videos are deleted.
- The real import test found a long source filename's metadata `dd` extending
  to x=630.53 in a 390px WebKit viewport. Constraining that flex child and allowing
  unbroken strings to wrap removes this independently reproduced overflow.

The real-file suite covers 320, 360, 375, 390, 414, 430 and 1440px widths in
Chromium and WebKit. It waits for rail images to decode and measures image,
thumbnail, text body, heading and every metadata box. It checks uniqueness,
current-video exclusion, separation and page overflow. Baseline and candidate
captures are under `qa/text-layout-artifacts/{before,after}/<engine>/local-<width>`.
The baseline capture is served from a separate checkout at `b0122ce`. Normal
test runs start their own server and refuse to reuse an existing server.

Chromium tests the full real-file import, decoding, poster capture and IndexedDB
pipeline. Windows WebKit cannot decode this H.264 fixture or persist Blobs;
its file input and import UI run with explicitly annotated probe/poster/storage
substitutes, using a real decoded thumbnail Blob. This does not verify iPhone
media decoding or storage. The target symptom still needs the reporter's actual
iPhone test; passing tests is not final acceptance.

Representative WebKit 390px real-file measurements:

| Measurement | Baseline | Candidate |
| --- | ---: | ---: |
| Draft records after 3 uploads | 5 (replayed completion) | 3 |
| Imported-file page scroll width | 631px | 390px |
| More From thumbnail right edge | 100px | 100px |
| More From heading/metadata left edge | 108px | 108px |
| Thumbnail/text gap | 8px | 8px |

The unchanged rail measurements explicitly mean that this engine did not
reproduce the device's thumbnail overlap before the containment change. The
layout change is a candidate for on-device verification, not a claimed
reproduction of that exact Safari failure. Desktop measurements retain a
96px thumbnail and an 8px gap.

Current verification: typecheck passed, all 74 unit/component tests passed,
production build passed, and all 94 Chromium/WebKit tests passed. On this
Windows host the runner stalled while cleaning up its Vite child process after
all cases completed; stopping that verified test-owned server allowed the
command to finish with exit code 0. No application process was stopped.

The original investigation below records the earlier negative reproduction.

---

Baseline: `686f1a8ccb1e1bc36dbdbe0e151f3839049ff76c` on `preview/v0.2.0`.

## Inspection

Inspected `WatchPage.tsx`, `VideoCard.tsx`, `Thumbnail.tsx`, `ChannelPage.tsx`,
the inline Related Videos markup, and `retro.css`, including every responsive
override. Main headings, card headings, and following metadata use normal block
flow with automatic heights and unitless line heights. Thumbnail badges and
duration chips are absolutely positioned inside a clipped thumbnail; titles and
metadata are not. No fixed text height, negative text margin, line clamp, or
nowrap rule was found on these titles. The collapsed description is clamped,
but the title is not. Compact grids already use `minmax(0, 1fr)` and text children
have `min-width: 0`.

The exact overlapping elements and cause on the reported iPhone remain
unidentified. The previous suite measured controls and thumbnail columns, but
did not directly check title/metadata boxes; its success was insufficient
evidence for the reported bug.

## Reproduction and regression coverage

`qa/text-layout.e2e.ts` runs in Chromium and WebKit at 320x568, 360x800,
375x667, 390x844, 414x896, 430x932, and a 1440x900 desktop control. Mobile runs
use touch, mobile viewport behavior, device scale 3, and an iPhone user agent.
These engines run on Windows, not on an actual iPhone.

The test exercises the main watch title, Related Videos, More From, search rows,
channel grids, browsing grids, home featured cards, and the local library. It
uses short, long, and 206-character unbroken titles with multiple metadata
fields, demo flags, and local-video flags. Fixtures do not assert codec support.
Chromium reads local-video Blob records from IndexedDB. This Windows WebKit
build fails to store Blob records; when that happens the test supplies equivalent
records through the `readLibrary` module boundary, records an annotation, and
still renders the actual application components. Thus WebKit local layout is
covered, but its file-import and persistence behavior is not verified here.

Assertions measure `getBoundingClientRect()` for each title and each following
metadata field, require `metadata.top >= title.bottom - 1px`, and reject
thumbnail/title intersections. Range rectangles also detect text painted
outside its title box or into another card's metadata. Page overflow remains a
separate assertion. Screenshots and full measurements are captured for every
route/viewport/engine.

Representative baseline measurements on `/watch/v-harbour`, WebKit 390x844,
in document CSS pixels:

| Pair | Title bottom | Metadata top | Gap |
| --- | ---: | ---: | ---: |
| Main title / demonstration note | 239.766 | 247.766 | 8.000 |
| First More From title / demo note | 1673.203 | 1675.203 | 2.000 |
| First Related title / metadata | 2163.359 | 2165.359 | 2.000 |

No title/metadata or thumbnail/title overlap was reproduced in the tested
baseline. The screenshots labelled `after` show the validation run after adding
the tests; **application styles are unchanged**, so these are not evidence of
a visual fix. The production JS/CSS bundle hashes remain unchanged as well.

## Evidence and commands

Validation: typecheck passed; all 72 unit/component tests passed; production
build passed; all 80 Playwright tests passed across Chromium and WebKit.
Each capture pass measured 3,976 title/metadata pairs across 154 route visits.
Neither pass found a box violation. The asserting pass also found no painted
text collisions. These are negative reproduction findings, not proof that the
reported iPhone bug is fixed.

Evidence is local and ignored by Git under `qa/text-layout-artifacts/`:

- `before/<engine>/<width>x<height>/`: baseline screenshots and measurements.
- `after/<engine>/<width>x<height>/`: asserting validation run.
- Each directory contains `measurements.json` and a PNG per route.

From the repository root:

```powershell
$env:OVERLAP_CAPTURE='before'
npm.cmd run test:responsive --workspace=apps/video -- --grep 'title and metadata flow'
Remove-Item Env:OVERLAP_CAPTURE
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:responsive
```

For the next reproduction, collect the exact preview URL and video, whether
the affected title is the main heading or a rail/card heading, the iOS version,
Safari page zoom/larger-text settings, and an on-device screenshot of the
overlap. Do not mark the release blocker resolved based on this suite passing.
