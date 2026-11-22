import { devices, expect, test } from '@playwright/test';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  // Local CC0 WebM bytes: no CDN availability, network playback, or codec mocks.
  const bytes = await readFile(path.resolve('qa/fixtures/flower.webm'));
  await page.route('**/media/cc0-videos/*.mp4', async route => {
    // Chromium requires real Range responses for seeking; returning an opaque
    // 200 body here falsely makes the fixture nonseekable in that browser.
    const range = /^bytes=(\d+)-(\d*)$/.exec(route.request().headers().range ?? '');
    const start = range ? Number(range[1]) : 0;
    const end = range && range[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1;
    await route.fulfill({
      status: range ? 206 : 200, contentType: 'video/webm', body: bytes.subarray(start, end + 1),
      headers: { 'Accept-Ranges': 'bytes', ...(range ? { 'Content-Range': `bytes ${start}-${end}/${bytes.length}` } : {}) },
    });
  });
});

test('classic controls play, pause, seek, mute and adjust volume on real media', async ({ page }) => {
  await page.goto('/watch/v-mdn-flower');
  const video = page.locator('video.player');
  await expect.poll(() => video.evaluate(v => Number.isFinite((v as HTMLVideoElement).duration) && (v as HTMLVideoElement).duration > 0)).toBe(true);
  await expect(video).not.toHaveAttribute('controls');
  await expect(video).toHaveAttribute('playsinline');
  const seek = page.getByRole('slider', { name: 'Seek video' });
  await expect(seek).toBeEnabled();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(0.2);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await seek.focus();
  await seek.press('Home');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeLessThan(0.1);
  await seek.press('ArrowRight');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(0);
  await expect(seek).toHaveAttribute('aria-valuetext', /of 0:0/);
  await page.getByRole('button', { name: 'Mute', exact: true }).click();
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).muted)).toBe(true);
  await page.getByRole('button', { name: 'Unmute', exact: true }).click();
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).muted)).toBe(false);
  const volume = page.getByRole('slider', { name: 'Volume', exact: true });
  await volume.focus();
  await volume.press('Home');
  await volume.press('ArrowRight');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).volume)).toBeCloseTo(0.05);
  const frame = page.locator('.classic-player');
  await frame.focus();
  await frame.press('k');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(false);
  await frame.press('k');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await page.getByRole('button', { name: 'Use device controls' }).click();
  await expect(video).toHaveAttribute('controls');
  await page.getByRole('button', { name: 'Use classic controls' }).click();
  await expect(video).not.toHaveAttribute('controls');
});

test('fullscreen retains controls or offers the explicit device fallback', async ({ page }) => {
  await page.goto('/watch/v-mdn-flower');
  await expect(page.getByRole('slider', { name: 'Seek video' })).toBeEnabled();
  const standard = await page.evaluate(() => Boolean(document.fullscreenEnabled));
  await page.getByRole('button', { name: 'Enter fullscreen' }).click();
  if (standard) {
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.className)).toBe('classic-player');
    await expect(page.getByRole('button', { name: 'Exit fullscreen' })).toBeVisible();
    await page.getByRole('button', { name: 'Exit fullscreen' }).click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
  } else {
    // Native iPhone fullscreen is tested on-device; Windows WebKit may have no
    // fullscreen API, so its fallback must leave an operable video element.
    const device = page.getByRole('button', { name: 'Use classic controls' });
    if (await device.count()) await expect(page.locator('video.player')).toHaveAttribute('controls');
  }
});

test('failed media stays accessible and offers device controls without script errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/watch/v-mdn-flower');
  // Invalid bytes exercise the decoder error path in every engine,
  // independently of each browser's network cancellation behavior.
  await page.locator('video.player').evaluate(v => {
    const video = v as HTMLVideoElement;
    video.src = 'data:video/webm;base64,bm90LXZpZGVv';
    video.load();
  });
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  // Safari may defer even a failed request until a user starts playback.
  await expect(page.locator('.classic-player__status')).toContainText(/could not (?:be loaded or decoded|start)/);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Use device controls' }).click();
  await expect(page.locator('video.player')).toHaveAttribute('controls');
  expect(errors).toEqual([]);
});

test.describe('Android-sized touch controls', () => {
  test.use({ viewport: { width: 360, height: 800 }, hasTouch: true,
    isMobile: async ({ browserName }, use) => { await use(browserName !== 'firefox'); },
    userAgent: devices['Pixel 7'].userAgent });
  test('volume and touch seek remain usable without covering the picture', async ({ page }) => {
    await page.goto('/watch/v-mdn-flower');
    const seek = page.getByRole('slider', { name: 'Seek video' });
    await expect(seek).toBeEnabled();
    const box = await seek.boundingBox();
    await seek.tap({ position: { x: box!.width * 0.65, y: box!.height / 2 } });
    await expect.poll(() => page.locator('video.player').evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(1);
    await expect(page.getByRole('slider', { name: 'Volume', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Play', exact: true }).tap();
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  });
});

test('keyboard shortcuts do not hijack the comment form; ended keeps the playlist queue', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('skeuo.video.state.v1', JSON.stringify({
    profile: { name: 'Nabus', handle: 'nabus' },
    playlists: [{ id: 'player-queue', name: 'Player test', videoIds: ['v-mdn-flower', 'v-harbour'], createdAt: '2026-11-23' }],
  })));
  await page.goto('/watch/v-mdn-flower?list=player-queue');
  await page.locator('#comment-body').fill('k mf arrow keys stay here');
  await expect.poll(() => page.locator('video.player').evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await page.getByLabel('Play the next video in this playlist automatically').check();
  // Real playback to the end, accelerated only by seeking near the end.
  const video = page.locator('video.player');
  await expect(page.getByRole('slider', { name: 'Seek video' })).toBeEnabled();
  await video.evaluate(v => { const media = v as HTMLVideoElement; media.currentTime = media.duration - 0.3; });
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page).toHaveURL(/watch\/v-harbour\?list=player-queue/);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});

for (const width of [320, 360, 375, 390, 414, 430, 768, 1440]) {
  test.describe(`player ${width}px`, () => {
    test.use({ viewport: { width, height: 844 }, ...(width < 768 ? {
      userAgent: devices['iPhone 13'].userAgent,
      isMobile: async ({ browserName }, use) => { await use(browserName !== 'firefox'); },
      hasTouch: true,
    } : {}) });
    test('player controls, title, metadata and rails occupy separate boxes', async ({ page }, testInfo) => {
      await page.goto('/watch/v-mdn-flower');
      await expect(page.getByRole('slider', { name: 'Seek video' })).toBeEnabled();
      const layout = await page.evaluate(() => {
        const rect = (el: Element) => el.getBoundingClientRect();
        const root = document.querySelector('.classic-player')!;
        const controls = [...root.querySelectorAll('button, input, summary')];
        const collisions: string[] = [];
        for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
          const a = rect(controls[i]), b = rect(controls[j]);
          if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) collisions.push(`${controls[i].className}/${controls[j].className}`);
        }
        return {
          width: innerWidth, scrollWidth: document.documentElement.scrollWidth, collisions,
          offscreen: controls.filter(c => rect(c).left < -1 || rect(c).right > innerWidth + 1).map(c => c.className),
          titleBottom: rect(document.querySelector('.watch-title')!).bottom,
          playerTop: rect(root).top, playerBottom: rect(root).bottom,
          bylineTop: rect(document.querySelector('.byline')!).top,
          videoBottom: rect(root.querySelector('video')!).bottom,
          controlsTop: rect(root.querySelector('.classic-player__controls')!).top,
          seekHeight: rect(root.querySelector('.classic-player__seek')!).height,
        };
      });
      expect(layout.collisions).toEqual([]);
      expect(layout.offscreen).toEqual([]);
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1);
      expect(layout.playerTop).toBeGreaterThanOrEqual(layout.titleBottom - 1);
      expect(layout.bylineTop).toBeGreaterThanOrEqual(layout.playerBottom - 1);
      expect(layout.controlsTop).toBeGreaterThanOrEqual(layout.videoBottom - 1);
      if (width < 768) {
        await expect(page.getByText('Device volume', { exact: true })).toBeVisible();
        await expect(page.getByRole('slider', { name: 'Volume', exact: true })).toHaveCount(0);
      }
      if (width <= 560) expect(layout.seekHeight).toBeGreaterThanOrEqual(44);
      await page.locator('.player-frame').screenshot({ path: testInfo.outputPath(`player-${width}.png`) });
      await testInfo.attach('player-layout', { body: JSON.stringify(layout, null, 2), contentType: 'application/json' });
    });
  });
}
