# Local media regression fixture

`flower.mp4` is the CC0 flower clip from MDN Web Docs, also used by the
application's demo catalog. Source:
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4

It stands in for a user's local video in upload/import UI tests. No user video
is included. Chromium exercises decoding, frame capture and IndexedDB storage.
Windows WebKit uses explicitly annotated media/storage substitutes because its
H.264 decoder and Blob persistence are unavailable in this environment.
