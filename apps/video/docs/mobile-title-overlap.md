# Mobile title/metadata overlap investigation

Status: **open, not reproduced in emulation**. No application CSS or component
fix is claimed. Acceptance requires reproducing the reported failure and then
checking the resulting preview on the reporter's actual iPhone.

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
