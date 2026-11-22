import { devices, expect, test } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const phase = process.env.OVERLAP_CAPTURE === 'before' ? 'before' : 'after';
const widths = [320, 360, 375, 390, 414, 430, 1440];
for (const width of widths) {
  test.describe(`local rail ${width}px`, () => {
    test.use(width < 768 ? { userAgent: devices['iPhone 13'].userAgent, isMobile: async ({ browserName }, use) => { await use(browserName !== 'firefox'); }, hasTouch: true, deviceScaleFactor: 3, viewport: { width, height: 844 } } : { viewport: { width, height: 900 } });
    test('real local file upload and import keep rail text clear', async ({ page }, testInfo) => {
      test.setTimeout(90_000);
      await page.addInitScript(() => {
        if (!localStorage.getItem('skeuo.video.state.v1')) localStorage.setItem('skeuo.video.state.v1', JSON.stringify({ profile: { name: 'Nabus', handle: 'nabus' } }));
      });
      await page.goto('/my-videos');
      const blobStorage = await page.evaluate(() => new Promise<boolean>(resolve => {
        let db: IDBDatabase | undefined;
        const finish = (supported: boolean) => { clearTimeout(timeout); db?.close(); resolve(supported); };
        const timeout = setTimeout(() => finish(false), 3000);
        const request = indexedDB.open('skeuo.qa.blob-probe', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('probe');
        request.onerror = () => finish(false);
        request.onsuccess = () => {
          db = request.result;
          try {
            const tx = db.transaction('probe', 'readwrite');
            tx.objectStore('probe').put({ file: new File(['probe'], 'probe.webm', { type: 'video/webm' }), poster: new Blob(['poster']) }, 'file');
            tx.oncomplete = () => finish(true);
            tx.onabort = tx.onerror = () => finish(false);
          } catch { finish(false); }
        };
      }));
      const blobDecoder = await page.evaluate(async () => {
        const library = await import('/src/lib/library.ts');
        try {
          const blob = await (await fetch('/qa/fixtures/flower.webm')).blob();
          await library.probeMediaFile(new File([blob], 'probe.webm', { type: 'video/webm' }));
          return true;
        } catch { return false; }
      });
      if (!blobStorage || !blobDecoder) {
        // Substitute only capabilities that this host actually fails. HTTP
        // playback in the separate player suite always uses real media APIs.
        await page.route('**/src/lib/library.ts', async route => {
          const response = await route.fetch();
          const storage = !blobStorage ? 'const qaRecords = []; readLibrary = async () => qaRecords; putLibraryRecord = async record => { qaRecords.push(record); };' : '';
          const media = !blobDecoder ? 'probeMediaFile = async () => ({durationSec:5,width:960,height:540}); capturePoster = async () => ({poster:await (await fetch("/thumbnails/flower.webp")).blob(),failure:null});' : '';
          await route.fulfill({ response, body: await response.text() + '\n' + storage + media + '\n' });
        });
        testInfo.annotations.push({ type: 'host capabilities', description: `Native Blob storage: ${blobStorage}; native Blob decoding: ${blobDecoder}. Only failed capabilities substituted; HTTP playback tested without substitutes.` });
      }
      const bytes = await readFile(path.resolve('qa/fixtures/flower.webm'));
      const titles = ['just flexing my abs hehehe :)', 'A long local video title describing my workout and how it went during the afternoon', 'Unbroken' + 'WorkoutVideo'.repeat(7)];
      const reports = [];
      const directory = path.resolve('qa/text-layout-artifacts', phase, testInfo.project.name, `local-${width}`);
      await mkdir(directory, { recursive: true });
      for (const title of titles) {
        await page.goto('/upload');
        await page.locator('#video-file').setInputFiles({ name: `${title}.webm`, mimeType: 'video/webm', buffer: bytes });
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
          await page.locator('#library-files').setInputFiles(titles.map(title => ({ name: `${title}.webm`, mimeType: 'video/webm', buffer: bytes })));
          await expect(page.locator('.library-card, .library-progress li.is-error')).toHaveCount(3, { timeout: 60000 });
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
