// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { defineConfig, devices } from '@playwright/test';

/**
 * Browser → API persistence for reject/undo, rotated bbox, and table overlay.
 *
 * Not part of the mocked structuring suite. Run only against a live stack:
 *
 *   E2E_WEB_URL=http://127.0.0.1:5173 \
 *   E2E_API_URL=http://127.0.0.1:3001 \
 *   DATABASE_URL=postgresql://docuvate:docuvate@127.0.0.1:5432/docuvate \
 *   pnpm --filter @docuvate/e2e exec playwright test --config=playwright.real-stack.config.ts
 *
 * DATABASE_URL is the precondition seed (one suggestion row) when the worker
 * has not written a review row yet. psql must be on PATH. The reject, undo,
 * rotation, bbox, and table steps go through the browser and are read back
 * from the API after a reload. A down stack fails the test.
 */
const webBase = process.env['E2E_WEB_URL'] ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './real-stack',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: 0,
  workers: 1,
  timeout: 240_000,
  reporter: [['list']],
  use: {
    baseURL: webBase,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
