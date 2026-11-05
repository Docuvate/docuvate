import { defineConfig, devices } from '@playwright/test';

/**
 * Design-system visual + a11y regression run.
 *
 * Self-contained: boots the Vite dev server on its own port and serves every API call from
 * synthetic in-test mocks (see tests/design-system/designSystemMocks.ts). No compose stack,
 * no real documents, no network access to a running Docuvate API.
 */
const port = Number(process.env['DESIGN_SYSTEM_E2E_PORT'] ?? '5181');
const webBase = `http://127.0.0.1:${String(port)}`;

export default defineConfig({
  testDir: './tests/design-system',
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
    command: `pnpm --filter @docuvate/web exec vite --host 127.0.0.1 --port ${String(port)} --strictPort`,
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
