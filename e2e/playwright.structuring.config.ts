import { defineConfig, devices } from '@playwright/test';

/**
 * Structuring journey (dashboard → library → viewer → review → export) on synthetic mocks.
 *
 * Self-contained: boots the Vite dev server on its own port and serves every API call from
 * synthetic in-test mocks (see tests/structuring/structuringMocks.ts). No compose stack,
 * no real documents, no network access to a running Docuvate API.
 */
const port = Number(process.env['STRUCTURING_E2E_PORT'] ?? '5182');
const webBase = `http://127.0.0.1:${String(port)}`;

export default defineConfig({
  testDir: './tests/structuring',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: process.env['CI'] ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: webBase,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `node apps/web/scripts/copy-pdf-worker.mjs && pnpm --filter @docuvate/web exec vite --host 127.0.0.1 --port ${String(port)} --strictPort`,
    cwd: '..',
    url: webBase,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    env: {
      VITE_API_URL: `${webBase}/api`,
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
