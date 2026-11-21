/**
 * Extract one real frame from a local video file and encode it as WebP.
 *
 * Usage:
 *   node scripts/extract-thumbnail.mjs <inputVideo> <outputWebp> [timeSeconds]
 *
 * The video is served from a throwaway loopback HTTP server so the canvas stays
 * same-origin and `toDataURL` is not blocked by tainting. Chromium's canvas WebP
 * encoder does the image encoding, so no extra image dependency is needed.
 *
 * Playback is verified before a frame is written: the element must report
 * `readyState >= 3` and a usable duration, and the clock must advance after play().
 * If any of that fails, the script exits non-zero and writes no image.
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';

const [inputArg, outputArg, timeArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  console.error('usage: node scripts/extract-thumbnail.mjs <inputVideo> <outputWebp> [timeSeconds]');
  process.exit(1);
}

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);
const seekTo = Number(timeArg ?? 3);
if (!existsSync(inputPath)) {
  console.error('missing input video:', inputPath);
  process.exit(1);
}
if (!Number.isFinite(seekTo) || seekTo < 0) {
  console.error('invalid timestamp:', timeArg);
  process.exit(1);
}

const MIME = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogv': 'video/ogg' };
const mime = MIME[extname(inputPath).toLowerCase()] ?? 'application/octet-stream';
const size = statSync(inputPath).size;

/**
 * Parse a single `bytes=start-end` range. Media elements only send this simple
 * form; anything unparseable or unsatisfiable falls back to the whole file,
 * which every client accepts.
 */
function parseRange(header, total) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? '');
  const whole = { start: 0, end: total - 1 };
  if (!match || (!match[1] && !match[2])) return whole;
  const [, rawStart, rawEnd] = match;
  if (!rawStart) {
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return whole;
    return { start: Math.max(0, total - suffix), end: total - 1 };
  }
  const start = Number(rawStart);
  const end = rawEnd ? Number(rawEnd) : total - 1;
  if (!Number.isFinite(start) || start >= total) return whole;
  return { start, end: Math.min(end, total - 1) };
}

const server = createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">' +
        '<video id="v" muted playsinline preload="auto" width="640"></video></body>',
    );
    return;
  }
  if (req.url === '/source') {
    // Honour `Range`, because the header below promises it. Advertising ranges
    // while always returning 200 makes some clients seek into a dead stream.
    const { start, end } = parseRange(req.headers.range, size);
    const partial = start > 0 || end < size - 1;
    res.writeHead(partial ? 206 : 200, {
      'content-type': mime,
      'content-length': String(end - start + 1),
      'accept-ranges': 'bytes',
      'cache-control': 'no-store',
      ...(partial ? { 'content-range': `bytes ${start}-${end}/${size}` } : {}),
    });
    createReadStream(inputPath, { start, end }).pipe(res);
    return;
  }
  res.writeHead(404).end();
});

await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ headless: true });
let failure;
try {
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });

  const playback = await page.evaluate(async ({ source, seek }) => {
    const video = document.querySelector('#v');
    video.src = source;
    await new Promise((ok, fail) => {
      video.addEventListener('loadedmetadata', ok, { once: true });
      video.addEventListener('error', () => fail(new Error('media error')), { once: true });
      setTimeout(() => fail(new Error('metadata timeout')), 15000);
    });
    const startTime = video.currentTime;
    await video.play();
    await new Promise((ok) => setTimeout(ok, 800));
    const advanced = video.currentTime > startTime;
    video.pause();

    if (!(video.readyState >= 3) || !Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error(`playback bar not met: readyState=${video.readyState} duration=${video.duration}`);
    }

    await new Promise((ok, fail) => {
      video.addEventListener('seeked', ok, { once: true });
      video.addEventListener('error', () => fail(new Error('seek error')), { once: true });
      video.currentTime = Math.min(seek, Math.max(0, video.duration - 0.1));
      setTimeout(() => fail(new Error('seek timeout')), 15000);
    });
    await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error('decoded frame has no dimensions');
    }
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = Math.round((640 * video.videoHeight) / video.videoWidth);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas 2d context unavailable');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return {
      dataUrl: canvas.toDataURL('image/webp', 0.82),
      width: canvas.width,
      height: canvas.height,
      sourceWidth: video.videoWidth,
      sourceHeight: video.videoHeight,
      duration: video.duration,
      readyState: video.readyState,
      advanced,
      currentTime: video.currentTime,
    };
  }, { source: `${origin}/source`, seek: seekTo });

  if (!playback.advanced) throw new Error('playback clock did not advance');
  if (!playback.dataUrl.startsWith('data:image/webp')) {
    throw new Error(`canvas did not encode WebP: ${playback.dataUrl.slice(0, 40)}`);
  }

  const bytes = Buffer.from(playback.dataUrl.split(',')[1], 'base64');
  // Created only now: a failed run must not leave an empty directory behind.
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, bytes);
  console.log(
    JSON.stringify(
      {
        output: outputPath,
        bytes: bytes.length,
        width: playback.width,
        height: playback.height,
        source: `${playback.sourceWidth}x${playback.sourceHeight}`,
        duration: Number(playback.duration.toFixed(2)),
        frameAt: Number(playback.currentTime.toFixed(2)),
        readyState: playback.readyState,
        clockAdvanced: playback.advanced,
      },
      null,
      2,
    ),
  );
} catch (error) {
  failure = error;
  console.error('extraction failed:', error.message);
} finally {
  await browser.close();
  await new Promise((ok) => server.close(ok));
}

process.exit(failure ? 1 : 0);
