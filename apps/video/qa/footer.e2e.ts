import { expect, test } from '@playwright/test';

test('footer links reach real pages and retain project notices', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('heading')).toHaveText(['Explore', 'Your Library', 'Skeuo', 'Legal']);
  await expect(footer).toContainText('Skeuo Video');
  await expect(footer).toContainText('Just videos. Like the old days.');
  await expect(footer).toContainText('© 2026 Skeuo contributors.');
  await expect(footer).toContainText('not affiliated with, endorsed by, or connected to YouTube or Google');
  await expect(footer.getByRole('link', { name: 'Categories', exact: true })).toHaveCount(0);
  await expect(footer).not.toContainText('Colophon');

  const externalLinks = [
    ['GitHub', 'https://github.com/subs-cantcode/skeuo'],
    ['Contributions', 'https://github.com/subs-cantcode/skeuo/blob/main/apps/video/CONTRIBUTING.md'],
    ['Report a Bug', 'https://github.com/subs-cantcode/skeuo/issues/new?template=bug_report.md'],
    ['MIT License', 'https://github.com/subs-cantcode/skeuo/blob/main/apps/video/LICENSE'],
    ['Third-party notices', 'https://github.com/subs-cantcode/skeuo/blob/main/apps/video/THIRD_PARTY.md'],
  ];
  for (const [name, href] of externalLinks) {
    await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }
  const hrefs = await footer.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(new Set(hrefs).size).toBe(hrefs.length);
  expect(hrefs.every((href) => href && href !== '#' && !href.startsWith('/categories'))).toBe(true);

  // Exercise the actual links, including signed-out library/channel destinations.
  const internalLinks = await footer.locator('a[href^="/"]').evaluateAll((links) =>
    links.map((link) => ({ name: link.textContent!.trim(), href: link.getAttribute('href')! })),
  );
  for (const { name, href } of internalLinks) {
    await footer.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(href);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toHaveCount(0);
  }

  // Fresh page requests must also resolve; client-side routing alone is insufficient.
  for (const [path, title] of [['/about', 'About Skeuo Video'], ['/privacy', 'Privacy'], ['/terms', 'Terms']]) {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('heading', { name: title, level: 1, exact: true })).toBeVisible();
    await expect(page).toHaveTitle(`${title} — Skeuo Video`);
  }
});

for (const width of [320, 360, 375, 390, 414, 430, 1440]) {
  test(`footer has no overlapping or clipped content at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/privacy');
    const footer = page.getByRole('contentinfo');
    await footer.scrollIntoViewIfNeeded();

    const measure = () => footer.evaluate((root) => {
      const errors: string[] = [];
      const bounds = root.getBoundingClientRect();
      const links = [...root.querySelectorAll('a')];
      const content = [...root.querySelectorAll('.site-footer__brand, section, .site-footer__legal')];
      for (const el of [...content, ...links]) {
        const box = el.getBoundingClientRect();
        if (box.left < -1 || box.right > innerWidth + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1) {
          errors.push(`Outside footer: ${el.textContent}`);
        }
        if (el.scrollWidth > el.clientWidth + 1) errors.push(`Clipped: ${el.textContent}`);
      }
      // Branding, notices, headings and links must occupy separate boxes.
      const textBoxes = [...root.querySelectorAll('.site-footer__brand, .site-footer__legal, h2, a')].map((el) => ({
        text: el.textContent,
        box: el.getBoundingClientRect(),
      }));
      for (let i = 0; i < textBoxes.length; i += 1) {
        for (let j = i + 1; j < textBoxes.length; j += 1) {
          const a = textBoxes[i];
          const b = textBoxes[j];
          if (Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left) > 1 &&
              Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top) > 1) {
            errors.push(`Overlap: ${a.text} / ${b.text}`);
          }
        }
      }
      return errors;
    });

    expect(await measure()).toEqual([]);
    if ([320, 390, 1440].includes(width)) {
      const path = testInfo.outputPath(`footer-${width}.png`);
      await footer.screenshot({ path });
      await testInfo.attach(`footer-${width}`, { path, contentType: 'image/png' });
    }

    // Browser text enlargement must grow the rows instead of painting over them.
    await page.addStyleTag({ content: '.site-footer, .site-footer h2, .site-footer span { font-size: 22px; }' });
    expect(await measure()).toEqual([]);
  });
}
