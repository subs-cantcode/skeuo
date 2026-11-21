import { defineConfig } from '@playwright/test';

/**
 * Responsive layout checks live outside Vitest: jsdom has no layout engine, so
 * overflow, overlap and aspect-ratio assertions only mean something in a real
 * browser. Run with `npm run test:responsive`.
 */
export default defineConfig({
  testDir: './qa',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5180',
  },
  webServer: {
    command: 'npm run dev -- --port 5180 --strictPort',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
