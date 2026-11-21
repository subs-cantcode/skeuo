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
mkdirSync(dirname(outputPath), { recursive: true });

const MIME = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogv': 'video/ogg' };
const mime = MIME[extname(inputPath).toLowerCase()] ?? 'application/octet-stream';
const size = statSync(inputPath).size;

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
    res.writeHead(200, {
      'content-type': mime,
      'content-length': String(size),
      'accept-ranges': 'bytes',
      'cache-control': 'no-store',
    });
    createReadStream(inputPath).pipe(res);
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

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = Math.round((640 * video.videoHeight) / video.videoWidth);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
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
