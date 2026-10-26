import { defineConfig, devices } from '@playwright/test';

import { smokeFixtureStoragePath } from './helpers/smoke-fixture-auth';

const webBase = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

/** Workstream B smoke — uses provision-smoke-storage.mjs (no global-search globalSetup). */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  timeout: 300_000,
  reporter: process.env['CI'] ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: webBase,
    storageState: smokeFixtureStoragePath(),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
