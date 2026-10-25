import { defineConfig, devices } from '@playwright/test';

const webBase = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

/** Playwright config for tests that mock network and do not need compose global setup. */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: webBase,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
