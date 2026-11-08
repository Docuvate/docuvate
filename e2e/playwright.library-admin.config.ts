import { defineConfig, devices } from '@playwright/test';

const webBase = process.env['E2E_WEB_URL'] ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests/library-admin',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: webBase,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
