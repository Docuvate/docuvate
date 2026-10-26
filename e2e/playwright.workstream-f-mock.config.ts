import { defineConfig, devices } from '@playwright/test';

const webBase = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: webBase,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
