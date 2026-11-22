# Classic HTML5 player

Final checks: typecheck passed, 87 unit/component tests passed, production build
passed, and 180 browser tests passed (60 each in Chromium, Firefox and WebKit).
Actual iPhone review remains pending.

The watch page uses `components/ClassicPlayer.tsx` with the existing source URL,
poster fallback and playlist-ended callback. It accepts HTTP media and local
Blob URLs without changing Upload, IndexedDB, library metadata, or object-URL
ownership. Native video decoding remains responsible for codec compatibility.
The fifth reference image was not available in the task thread; the written
gray-gradient, beveled-button and Skeuo Blue requirements guided the design.

## Interface and behavior

- Original inline SVG geometry for play, pause, speaker, mute and fullscreen;
  CSS gradients and rectangular beveled slider thumbs. No external icon set,
  copied platform asset, Flash, player dependency, autoplay feed, or tracking.
- Play/pause state follows media events, including buffering, native pauses,
  completion and rejected `play()` promises. Timestamps and the blue progress
  fill use actual decoded duration rather than fictional catalog metadata.
- Native range inputs provide seeking and volume, keyboard semantics and
  descriptive accessible values. Every icon button has an accessible name;
  mute exposes its pressed state. Errors and buffering use a polite live region.
- Controls remain below the picture in normal document flow. At phone widths
  the seek bar has a separate row, play/mute/fullscreen targets are 44px, and
  title and metadata remain outside the controller. Variable text has no fixed
  height. Existing rail containment remains intact.
- Focus the video or player for Space/K (play/pause), Left/Right (seek 5s),
  Home/End (start/end), M (mute), F (fullscreen), Up/Down (volume). Buttons and
  ranges retain their native keyboard behavior; unrelated forms are untouched.
  The shortcut legend is expandable. Shortcuts stop when device controls are
  selected, avoiding competing with native media keyboard handlers.
- `playsInline` preserves inline playback. Standard fullscreen includes the
  whole controller; Safari's video-only `webkitEnterFullscreen` is the fallback.
  Native iPhone fullscreen can therefore show the system's controls. A visible
  “Use device controls” option is also available without changing the source or
  playback position. Failed fullscreen requests enable this fallback.
- iPhone/iPad use a labelled device-volume hint and a working mute toggle;
  other platforms get the volume slider. No artificial software-gain workaround
  changes the video source or audio path. Hardware volume and native fullscreen
  behavior require actual iPhone acceptance testing.

Safari API reference: [Apple's video delivery guidance](https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari)
and [video fullscreen method](https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1633500-webkitenterfullscreen).

## Verification

`ClassicPlayer.test.tsx` covers media-driven state, duration/seek limits, mute
and zero-volume recovery, play rejection, shortcut scoping, source replacement,
native fallback, Safari fullscreen dispatch, and the playlist completion hook.

`qa/player.e2e.ts` uses an actual CC0 WebM video, served with proper HTTP byte
ranges. It checks playback, seek, volume, mute, fullscreen, failure recovery,
Android-sized touch input, playlist advancement, and bounding boxes at 320,
360, 375, 390, 414, 430, 768 and 1440px in Chromium, Firefox and WebKit.
Screenshots and measurement attachments are under `test-results/player.*`.

The existing local-file regression suite now uses that WebM fixture for all
three engines. It probes Blob persistence and decoding first: only capabilities
that fail those probes are substituted, with explicit test annotations. File
input and validation remain real; decoding, frame extraction and storage remain
real wherever their probes pass. The actual player always renders, and the
separate player suite exercises real HTTP media playback in every engine.
This replaces the previous unconditional WebKit decoder mock. Firefox
uses a phone-sized viewport and touch emulation; its engine does not support
Playwright's `isMobile` context flag, so that flag is limited to the other two.

On this host Firefox launch and WebKit decoder subprocesses require running
the browser suite outside the filesystem sandbox. Device emulation does not
establish actual iPhone Safari or Android-device acceptance. The iPhone review
requested by the project owner remains required before approval.

## Changed files

- `src/components/ClassicPlayer.tsx` and `ClassicPlayer.test.tsx`
- `src/pages/WatchPage.tsx` and `src/styles/retro.css`
- `playwright.config.ts`
- `qa/player.e2e.ts`, `qa/local-rail.e2e.ts`, `qa/responsive.e2e.ts`, `qa/text-layout.e2e.ts`
- `qa/fixtures/flower.webm` and `qa/fixtures/README.md`
- `THIRD_PARTY.md` and this document
