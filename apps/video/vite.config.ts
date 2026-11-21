import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The workspace's browser automation only opens http://localhost, so bind IPv4
    // too. 127.0.0.1 is loopback only, so this stays local; do not add --host.
    host: '127.0.0.1',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
