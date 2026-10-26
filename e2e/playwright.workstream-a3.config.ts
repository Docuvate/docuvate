import { defineConfig, devices } from '@playwright/test';

import { smokeFixtureStoragePath } from './helpers/smoke-fixture-auth.js';

const webBase = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';

/** A3 list perf — uses provision-smoke-storage.mjs; no global-search globalSetup. */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: process.env['CI'] ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: webBase,
    storageState: smokeFixtureStoragePath(),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  metadata: { apiBase },
});
