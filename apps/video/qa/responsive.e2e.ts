import { expect, test, type Page } from '@playwright/test';

/**
 * Responsive regression checks.
 *
 * These run in Chromium against the real stylesheet, because jsdom cannot
 * measure layout. Every assertion is one of the release requirements:
 * no page-level horizontal scrolling, no controls pushed off-screen, video and
 * thumbnails keeping their aspect ratio, and no overlapping controls.
 *
 * Deliberate exclusions:
 * - `.skip-link` sits off-screen until focused, by design.
 * - inline links inside a sentence wrap across lines and their bounding boxes
 *   legitimately overlap; only block-level controls are compared.
 * - hidden controls inside a closed <details> keep layout boxes in Chromium but
 *   are not painted, so they are filtered with `checkVisibility()`.
 */

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

const routes = [
  { path: '/', name: 'home' },
  { path: '/videos', name: 'videos' },
  { path: '/videos/Music', name: 'category' },
  { path: '/watch/v-harbour', name: 'watch' },
  { path: '/results?q=repair', name: 'search' },
  { path: '/my-videos', name: 'my-videos' },
  { path: '/channel/backlot', name: 'channel' },
  { path: '/playlists', name: 'playlists' },
  { path: '/signin', name: 'signin' },
  { path: '/no-such-route', name: 'not-found' },
];

interface LayoutReport {
  innerWidth: number;
  scrollWidth: number;
  offscreen: string[];
  overlapping: string[];
  videoRatio: number | null;
  badThumbs: string[];
  thumbOverText: string[];
  duplicateRailIds: string[];
  currentInRail: boolean;
}

async function measure(page: Page): Promise<LayoutReport> {
  return page.evaluate(() => {
    const rect = (el: Element) => el.getBoundingClientRect();
    const visible = (el: Element) => {
      const box = rect(el);
      if (box.width <= 0 || box.height <= 0) return false;
      const check = (el as HTMLElement).checkVisibility;
      return typeof check === 'function'
        ? (el as HTMLElement).checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
        : true;
    };
    const label = (el: Element) =>
      el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '');

    const vw = window.innerWidth;
    const controls = [...document.querySelectorAll('a, button, input, select, textarea, summary')]
      .filter(visible)
      .filter((el) => !el.classList.contains('skip-link'));

    const offscreen = controls
      .filter((el) => {
        const box = rect(el);
        return box.right > vw + 1 || box.left < -1;
      })
      .map(label);

    // Only compare elements that lay out as boxes; inline links share a line box.
    const blockControls = controls.filter((el) => getComputedStyle(el).display !== 'inline');
    const overlapping: string[] = [];
    for (let i = 0; i < blockControls.length; i += 1) {
      for (let j = i + 1; j < blockControls.length; j += 1) {
        const a = blockControls[i];
        const b = blockControls[j];
        if (a.contains(b) || b.contains(a)) continue;
        const ar = rect(a);
        const br = rect(b);
        const overlapX = Math.min(ar.right, br.right) - Math.max(ar.left, br.left);
        const overlapY = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top);
        if (overlapX > 4 && overlapY > 4) overlapping.push(`${label(a)} x ${label(b)}`);
      }
    }

    const video = document.querySelector('video.player');
    const videoRatio = video
      ? +(rect(video).width / rect(video).height).toFixed(3)
      : null;

    const badThumbs = [...document.querySelectorAll('.thumb img')]
      .filter((img) => {
        const box = rect(img);
        if (box.width === 0) return false;
        const ratio = box.width / box.height;
        return Math.abs(ratio - 16 / 9) > 0.05 || box.right > vw + 1;
      })
      .map(label);

    // A thumbnail wider than its grid column paints over the title. This is the
    // regression the v0.2.0 audit found at 320-1000px, so it gets its own check.
    const thumbOverText = [
      ...document.querySelectorAll('.video-card--compact, .related-list__item, .playlist-items__row'),
    ]
      .filter((card) => {
        const thumb = card.querySelector('.thumb');
        const title = card.querySelector('.video-card__title, .related-list__title');
        if (!thumb || !title) return false;
        const t = rect(thumb);
        const h = rect(title);
        return t.right > h.left + 1 && t.left < h.left;
      })
      .map(label);

    // The rail must show each video once, and never the one being watched.
    // One href per card: a related row links both its thumbnail and its title.
    const railHrefsIn = (selector: string) =>
      [...(document.querySelector(selector)?.children ?? [])].map(
        (card) => card.querySelector('a[href^="/watch/"]')?.getAttribute('href') ?? '',
      );
    const duplicateRailIds: string[] = [];
    const currentInRail =
      railHrefsIn('.compact-list').includes(window.location.pathname) ||
      railHrefsIn('.related-list').includes(window.location.pathname);
    for (const selector of ['.compact-list', '.related-list']) {
      const seen = new Set<string>();
      for (const href of railHrefsIn(selector)) {
        if (seen.has(href)) duplicateRailIds.push(`${selector} ${href}`);
        seen.add(href);
      }
    }

    return {
      innerWidth: vw,
      scrollWidth: document.documentElement.scrollWidth,
      offscreen: [...new Set(offscreen)],
      overlapping: [...new Set(overlapping)],
      videoRatio,
      badThumbs: [...new Set(badThumbs)],
      thumbOverText: [...new Set(thumbOverText)],
      duplicateRailIds: [...new Set(duplicateRailIds)],
      currentInRail,
    };
  });
}

test('category labels are corrected and the new category resolves', async ({ page }) => {
  await page.goto('/results?q=repair');
  await expect(page.locator('#category-filter')).toBeVisible();
  const options = await page.locator('select option').allTextContents();

  expect(options).toContain('How to & Style');
  expect(options).toContain('Non-profit & Activism');
  expect(options).toContain('Fitness & Health');
  expect(options).not.toContain('Howto & Style');
  expect(options).not.toContain('Nonprofits & Activism');

  await page.goto('/videos/Fitness%20%26%20Health');
  await expect(page.locator('h1').first()).toContainText('Fitness & Health');

  // A link written with the old spelling still resolves instead of 404ing.
  await page.goto('/videos/Howto%20%26%20Style');
  await expect(page.locator('h1').first()).toContainText('How to & Style');
});

test('legacy category URLs preserve refinements, fragments and category paths', async ({ page }) => {
  await page.goto('/categories?sort=newest&page=2#category-index');
  await expect(page).toHaveURL('/videos?sort=newest&page=2#category-index');
  await expect(page.getByRole('heading', { name: 'Browse videos', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Recently added', exact: true }).first()).toHaveAttribute('aria-current', 'true');
  await expect(page.getByRole('navigation', { name: 'Pagination' }).locator('[aria-current="page"]')).toHaveText('2');
  await page.goto('/categories/Howto%20%26%20Style?sort=oldest&page=1');
  await expect(page).toHaveURL('/videos/Howto%20%26%20Style?sort=oldest&page=1');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How to & Style');
  await expect(page.getByRole('link', { name: 'Oldest', exact: true })).toHaveAttribute('aria-current', 'true');
});

test('Videos is the single canonical browse navigation and categories remain selectable', async ({ page }) => {
  await page.goto('/videos');
  const nav = page.getByRole('navigation', { name: 'Primary' });
  await expect(nav.getByRole('link', { name: 'Videos', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Videos', exact: true })).toHaveCount(1);
  await expect(nav.getByRole('link', { name: 'Categories', exact: true })).toHaveCount(0);
  await expect(page.locator('a[href^="/categories"]')).toHaveCount(0);
  await page.locator('.category-table').getByRole('link', { name: 'Music', exact: true }).click();
  await expect(page).toHaveURL('/videos/Music');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Music');
  await expect(nav.getByRole('link', { name: 'Videos', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await page.goto('/results?q=repair&category=How+to+%26+Style&sort=newest');
  await expect(page.locator('#category-filter')).toHaveValue('How to & Style');
  await expect(page.locator('.results-count')).toContainText('How to & Style');
});

test('a category redirect replaces history instead of trapping Back', async ({ page }) => {
  await page.goto('/channels');
  await page.evaluate(() => {
    history.pushState(null, '', '/categories?sort=newest');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page).toHaveURL('/videos?sort=newest');
  await page.goBack();
  await expect(page).toHaveURL('/channels');
  await expect(page.getByRole('heading', { level: 1, name: 'Channels', exact: true })).toBeVisible();
});

for (const viewport of viewports) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const route of routes) {
      test(`${route.name} fits the viewport`, async ({ page }) => {
        await page.goto(route.path);
        await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Videos', exact: true })).toBeVisible();
        const report = await measure(page);

        expect(report.scrollWidth, 'no page-level horizontal scroll').toBeLessThanOrEqual(
          report.innerWidth + 1,
        );
        expect(report.offscreen, 'no control pushed off-screen').toEqual([]);
        expect(report.overlapping, 'no overlapping controls').toEqual([]);
        expect(report.badThumbs, 'thumbnails keep 16:9 and stay inside the page').toEqual([]);
        expect(report.thumbOverText, 'compact thumbnails stay inside their column').toEqual([]);
        expect(report.duplicateRailIds, 'rail lists each video once').toEqual([]);
        expect(report.currentInRail, 'rail excludes the video being watched').toBe(false);

        if (report.videoRatio !== null) {
          expect(Math.abs(report.videoRatio - 16 / 9)).toBeLessThan(0.02);
        }
      });
    }
  });
}
