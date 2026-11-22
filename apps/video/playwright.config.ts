import { defineConfig } from '@playwright/test';

const externalServer = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalServer ?? 'http://127.0.0.1:5183';

/**
 * Responsive layout checks live outside Vitest: jsdom has no layout engine, so
 * overflow, overlap and aspect-ratio assertions only mean something in a real
 * browser. Run with `npm run test:responsive`.
 */
export default defineConfig({
  testDir: './qa',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 3,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  reporter: [['list']],
  use: {
    baseURL,
  },
  webServer: externalServer ? undefined : {
    command: 'npm run dev -- --port 5183 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
