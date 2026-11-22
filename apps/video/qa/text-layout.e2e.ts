import { devices, expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const phase = process.env.OVERLAP_CAPTURE === 'before' ? 'before' : 'after';
const sizes = [
  [320, 568], [360, 800], [375, 667], [390, 844], [414, 896], [430, 932],
  [1440, 900],
];
const titles = [
  'Layout clip',
  'Layout clip with a long title describing a morning walk along the coast and the people we met on the way home',
  'Layout' + 'VeryLongUnbrokenVideoTitle'.repeat(8),
];

async function seed(page: Page) {
  await page.goto('/');
  const storageError = await page.evaluate(async (titles) => {
    localStorage.setItem('skeuo.video.state.v1', JSON.stringify({
      drafts: titles.map((title, index) => ({
        id: `layout-${index}`, title, description: 'Layout regression with several metadata fields.',
        channelId: 'northlight', category: 'Film & Animation', tags: ['layout'],
        durationSec: 123, views: 123456789, uploadedAt: '2026-11-22T12:00:00Z',
        src: '', thumbSeed: index + 10, demo: true,
      })),
    }));
    // Seed the actual IndexedDB schema. Media is a synthetic Blob: this tests
    // stored-library layout, not codec support or the file import pipeline.
    return new Promise<string | null>((resolve) => {
      const request = indexedDB.open('skeuo.video.library', 1);
      request.onupgradeneeded = () => {
        for (const store of ['videos', 'media']) {
          if (!request.result.objectStoreNames.contains(store)) {
            request.result.createObjectStore(store, { keyPath: 'id' });
          }
        }
      };
      request.onerror = () => resolve(String(request.error));
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(['videos', 'media'], 'readwrite');
        titles.forEach((title, index) => {
          const id = `layout-local-${index}`;
          tx.objectStore('videos').put({
            id, title, description: 'Local layout fixture', fileName: 'layout.mp4',
            mimeType: 'video/mp4', sizeBytes: 10, durationSec: 123, width: 640,
            height: 360, importedAt: '2026-11-22T12:00:00Z', thumbSeed: index + 20,
          });
          tx.objectStore('media').put({ id, file: new Blob(['layout'], { type: 'video/mp4' }), poster: null });
        });
        tx.oncomplete = () => { db.close(); resolve(null); };
        tx.onerror = () => { db.close(); resolve(`Fixture transaction: ${tx.error?.message ?? 'failed storing Blob'}`); };
      };
    });
  }, titles);
  if (storageError) {
    // Windows Playwright WebKit cannot persist Blob values in this environment.
    // Supply the same records at the storage boundary to exercise real local
    // card/watch components. This is explicitly not an import/storage test.
    await page.route('**/src/lib/library.ts', async route => {
      const response = await route.fetch();
      const body = await response.text();
      const records = titles.map((title, index) => ({
        id: `layout-local-${index}`, title, description: 'Local layout fixture',
        fileName: 'layout.mp4', mimeType: 'video/mp4', sizeBytes: 10, durationSec: 123,
        width: 640, height: 360, importedAt: '2026-11-22T12:00:00Z', thumbSeed: index + 20,
      }));
      await route.fulfill({ response, body: body + `\nreadLibrary = async () => ${JSON.stringify(records)}.map(r => ({...r, file: new Blob(['layout'], {type:'video/mp4'}), poster:null}));\n` });
    });
  }
  return storageError;
}

async function measure(page: Page) {
  return page.evaluate(() => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right, width: r.width, height: r.height };
    };
    const pairs: Array<{
      context: string; title: ReturnType<typeof box>; metadata: ReturnType<typeof box>;
      gap: number; thumbnailOverlap: boolean; textOutsideTitle: boolean;
      style: { lineHeight: string; fontSize: string; display: string; height: string; overflow: string };
    }> = [];
    const add = (title: Element, metadata: Element, thumbnail: Element | null, context: string) => {
      const t = box(title), m = box(metadata);
      const thumb = thumbnail ? box(thumbnail) : null;
      const style = getComputedStyle(title);
      const range = document.createRange();
      range.selectNodeContents(title);
      const rects = [...range.getClientRects()];
      pairs.push({
        context, title: t, metadata: m, gap: m.top - t.bottom,
        thumbnailOverlap: !!thumb && Math.min(t.right, thumb.right) - Math.max(t.left, thumb.left) > 1 &&
          Math.min(t.bottom, thumb.bottom) - Math.max(t.top, thumb.top) > 1,
        // Element boxes alone miss painted text overflowing a short line box.
        textOutsideTitle: rects.some(r => r.bottom + scrollY > t.bottom + 2 || r.top + scrollY < t.top - 2 || r.right > t.right + 1 || r.left < t.left - 1),
        style: { lineHeight: style.lineHeight, fontSize: style.fontSize, display: style.display, height: style.height, overflow: style.overflow },
      });
    };
    const mainTitle = document.querySelector('.watch-title');
    if (mainTitle) {
      for (const meta of document.querySelectorAll('.watch-main > .watch-note, .byline, .watch-stats')) add(mainTitle, meta, null, 'watch-main');
    }
    for (const card of document.querySelectorAll('.video-card, .related-list__item')) {
      const title = card.querySelector('.video-card__title, .related-list__title');
      if (!title) continue;
      for (const meta of card.querySelectorAll('.video-card__meta, .video-card__note, .video-card__attribution, .video-card__snippet, .video-card__tagline, .meta')) {
        add(title, meta, card.querySelector('.thumb'), card.className);
      }
    }
    const textRects = (el: Element) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return [...range.getClientRects()];
    };
    const textCollisions: string[] = [];
    const allMetadata = document.querySelectorAll('.video-card__meta, .video-card__note, .video-card__attribution, .related-list__item .meta, .watch-note, .byline p, .watch-stats > .meta');
    for (const title of document.querySelectorAll('.watch-title, .video-card__title, .related-list__title')) {
      for (const meta of allMetadata) {
        if (textRects(title).some(t => textRects(meta).some(m =>
          Math.min(t.right, m.right) - Math.max(t.left, m.left) > 1 &&
          Math.min(t.bottom, m.bottom) - Math.max(t.top, m.top) > 1))) {
          textCollisions.push(`${title.className} / ${meta.className}`);
        }
      }
    }
    return { pairs, textCollisions, width: innerWidth, scrollWidth: document.documentElement.scrollWidth };
  });
}

for (const [width, height] of sizes) {
  test.describe(`${width}px text layout`, () => {
  test.use(width < 768 ? {
    isMobile: true, hasTouch: true, deviceScaleFactor: 3,
    userAgent: devices['iPhone 13'].userAgent,
  } : { isMobile: false });
  test(`title and metadata flow at ${width}x${height}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height });
    // Layout must be deterministic and independent of external media loading.
    await page.route('https://**/*', route => route.abort());
    const storageError = await seed(page);
    testInfo.annotations.push({ type: 'library fixture', description: storageError ?? 'IndexedDB Blob records' });
    const routes = [
      '/watch/v-harbour', '/watch/layout-0', '/watch/layout-1', '/watch/layout-2',
      '/watch/layout-local-2', '/results?q=Layout', '/channel/northlight',
      '/channel/library', '/my-videos', '/videos', '/',
    ];
    const reports = [];
    const directory = path.resolve('qa/text-layout-artifacts', phase, testInfo.project.name, `${width}x${height}`);
    await mkdir(directory, { recursive: true });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
      if (route.includes('layout-local')) await expect(page.locator('.watch-title')).toHaveText(titles[2]);
      if (route === '/my-videos' || route === '/channel/library') await expect(page.locator('.video-card')).toHaveCount(3);
      await page.evaluate(() => document.fonts.ready);
      const report = await measure(page);
      reports.push({ route, ...report });
      await page.screenshot({ path: path.join(directory, route.replace(/[^a-z0-9-]/gi, '_') + '.png'), fullPage: true });
      if (phase !== 'before') {
        expect.soft(report.scrollWidth, route + ' horizontal overflow').toBeLessThanOrEqual(width + 1);
        expect.soft(report.pairs.length, route + ' measures title/metadata pairs').toBeGreaterThan(0);
        expect.soft(report.textCollisions, route + ' no painted text collisions, including adjacent cards').toEqual([]);
        for (const pair of report.pairs) {
          const label = `${route} ${pair.context} ${JSON.stringify(pair)}`;
          expect.soft(pair.gap, label + ' metadata follows title').toBeGreaterThanOrEqual(-1);
          expect.soft(pair.thumbnailOverlap, label + ' thumbnail clear of title').toBe(false);
          expect.soft(pair.textOutsideTitle, label + ' title contains painted text').toBe(false);
        }
      }
    }
    const file = path.join(directory, 'measurements.json');
    await writeFile(file, JSON.stringify(reports, null, 2));
    await testInfo.attach(`${phase}-measurements`, { path: file, contentType: 'application/json' });
  });
  });
}
