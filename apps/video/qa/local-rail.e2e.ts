import { devices, expect, test } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const phase = process.env.OVERLAP_CAPTURE === 'before' ? 'before' : 'after';
const widths = [320, 360, 375, 390, 414, 430, 1440];
for (const width of widths) {
  test.describe(`local rail ${width}px`, () => {
    test.use(width < 768 ? { userAgent: devices['iPhone 13'].userAgent, isMobile: true, hasTouch: true, deviceScaleFactor: 3, viewport: { width, height: 844 } } : { viewport: { width, height: 900 } });
    test('real local file upload and import keep rail text clear', async ({ page, browserName }, testInfo) => {
      test.setTimeout(90_000);
      await page.addInitScript(() => {
        if (!localStorage.getItem('skeuo.video.state.v1')) localStorage.setItem('skeuo.video.state.v1', JSON.stringify({ profile: { name: 'Nabus', handle: 'nabus' } }));
      });
      if (browserName === 'webkit') {
        // Windows WebKit cannot decode this H.264 clip or persist Blob values.
        // Exercise file selection/import rendering with explicit media/storage
        // substitutes. Chromium exercises the complete real-file pipeline.
        await page.route('**/src/lib/library.ts', async route => {
          const response = await route.fetch();
          await route.fulfill({ response, body: await response.text() + '\nconst qaRecords = []; readLibrary = async () => qaRecords; putLibraryRecord = async record => { qaRecords.push(record); }; probeMediaFile = async () => ({durationSec:5,width:960,height:540}); capturePoster = async () => ({poster:await (await fetch("/thumbnails/flower.webp")).blob(),failure:null});\n' });
        });
        testInfo.annotations.push({ type: 'media/storage limit', description: 'Windows WebKit H.264 decoding and Blob persistence replaced at module boundaries; real thumbnail Blob and local upload/import UI rendered.' });
      }
      const bytes = await readFile(path.resolve('qa/fixtures/flower.mp4'));
      const titles = ['just flexing my abs hehehe :)', 'A long local video title describing my workout and how it went during the afternoon', 'Unbroken' + 'WorkoutVideo'.repeat(7)];
      const reports = [];
      const directory = path.resolve('qa/text-layout-artifacts', phase, testInfo.project.name, `local-${width}`);
      await mkdir(directory, { recursive: true });
      for (const title of titles) {
        await page.goto('/upload');
        await page.locator('#video-file').setInputFiles({ name: `${title}.mp4`, mimeType: 'video/mp4', buffer: bytes });
        await page.locator('#upload-title').fill(title);
        await page.locator('#upload-category').selectOption('Fitness & Health');
        // Native form submission via Enter avoids mobile-emulation pointer
        // coordinates while the browser's video preview changes intrinsic size.
        await page.locator('#upload-title').press('Enter');
        await expect(page.locator('.watch-title')).toHaveText(title, { timeout: 15000 });
        await page.waitForFunction(() => {
          const state = JSON.parse(localStorage.getItem('skeuo.video.state.v1') ?? '{}');
          return state.drafts?.length > 0;
        });
      }
      for (const mode of ['upload', 'import']) {
        if (mode === 'import') {
          await page.goto('/my-videos');
          await page.locator('#library-files').setInputFiles(titles.map(title => ({ name: `${title}.mp4`, mimeType: 'video/mp4', buffer: bytes })));
          await expect(page.locator('.library-card')).toHaveCount(3, { timeout: 60000 });
          await page.locator('.library-card .video-card__title a').first().click();
        }
        await page.locator('.watch-rail').scrollIntoViewIfNeeded();
        await page.locator('.watch-rail img').evaluateAll(async images => {
          await Promise.all(images.map(async image => { const img = image as HTMLImageElement; img.loading = 'eager'; await img.decode().catch(() => {}); }));
        });
        const report = await page.locator('.watch-rail').evaluate(rail => {
          const box = (el: Element) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }; };
          const rows = [...rail.querySelectorAll('.video-card--compact, .related-list__item')].map(card => {
            const thumb = card.querySelector('.thumb')!;
            const title = card.querySelector('.video-card__title, .related-list__title')!;
            const text = card.querySelector('.video-card__body') ?? card.children[1];
            return {
              context: card.className, title: title.textContent, href: card.querySelector('a')!.getAttribute('href'),
              thumb: box(thumb), image: box(thumb.querySelector('img')!), text: box(text), heading: box(title),
              metadata: [...card.querySelectorAll('.video-card__meta, .video-card__note, .meta')].map(box),
            };
          });
          const state = JSON.parse(localStorage.getItem('skeuo.video.state.v1') ?? '{}');
          const overflowing = [...document.querySelectorAll('main *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => ({ tag: el.tagName, className: el.className, box: box(el), text: el.textContent?.slice(0,120) }));
          return { rows, overflowing, current: location.pathname, drafts: state.drafts.map((d: { id: string; title: string }) => ({ id: d.id, title: d.title })), width: innerWidth, scrollWidth: document.documentElement.scrollWidth };
        });
        reports.push({ mode, ...report });
        await writeFile(path.join(directory, 'measurements.json'), JSON.stringify(reports, null, 2));
        await page.locator('.watch-rail').screenshot({ path: path.join(directory, `${mode}-rail.png`) });
        if (phase !== 'before') {
          expect.soft(report.drafts).toHaveLength(3);
          expect.soft(report.scrollWidth).toBeLessThanOrEqual(report.width + 1);
          for (const context of ['video-card video-card--compact', 'related-list__item']) {
            const rows = report.rows.filter(row => row.context === context);
            expect.soft(rows.length).toBeGreaterThan(0);
            expect.soft(new Set(rows.map(row => row.href)).size).toBe(rows.length);
            expect.soft(new Set(rows.map(row => row.title)).size).toBe(rows.length);
            expect.soft(rows.some(row => row.href === report.current)).toBe(false);
          }
          for (const row of report.rows) {
            expect.soft(row.thumb.right, JSON.stringify(row)).toBeLessThanOrEqual(row.text.left + 1);
            expect.soft(row.image.right).toBeLessThanOrEqual(row.text.left + 1);
            for (const meta of row.metadata) expect.soft(meta.top).toBeGreaterThanOrEqual(row.heading.bottom - 1);
          }
        }
      }
      await writeFile(path.join(directory, 'measurements.json'), JSON.stringify(reports, null, 2));
    });
  });
}
