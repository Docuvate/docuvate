import { defineConfig, devices } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = dirname(fileURLToPath(import.meta.url));
const siteBase = process.env['E2E_SITE_URL'] ?? 'http://127.0.0.1:8081';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: 0,
  workers: 1,
  reporter: process.env['CI'] ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: siteBase,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env['E2E_SITE_URL']
    ? undefined
    : {
        command: 'pnpm run preview',
        cwd: siteRoot,
        url: siteBase,
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
      },
});
