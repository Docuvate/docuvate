// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { defineConfig } from '@playwright/test';

const baseURL = process.env.DOCUVATE_WEB_BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['./reporters/matrix-reporter.ts']],
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'public-readonly',
      testMatch: /public-readonly\.spec\.ts/,
    },
    {
      name: 'authenticated-readonly',
      testMatch: /authenticated-readonly\.spec\.ts/,
      fullyParallel: false,
    },
    {
      name: 'authenticated-synthetic',
      testMatch: /authenticated-synthetic\.spec\.ts/,
      fullyParallel: false,
    },
  ],
});
