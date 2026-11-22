# Local media regression fixture

`flower.mp4` is the CC0 flower clip from MDN Web Docs, also used by the
application's demo catalog. Source:
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4

`flower.webm` is the same CC0 sample in WebM, used for actual playback tests:
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm

These stand in for user videos in upload/import tests; no user video is included.
The current suite uses WebM for real decoding and poster extraction in all three
engines. A runtime probe checks IndexedDB Blob persistence. Only if that probe
fails is the storage boundary replaced, with an explicit test annotation.
