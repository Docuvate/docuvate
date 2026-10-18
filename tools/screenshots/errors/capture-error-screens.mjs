#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Error screen screenshots (1440 / 1024 / 390, de, light+dark).
 * Requires web on WEB_BASE with seeded login (see scripts/capture-ui-review-screenshots.mjs).
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const OUT = process.env.SCREENSHOT_DIR ?? '/opt/cursor/artifacts/screenshots/errors';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';
const SKIP_LOGIN = process.env.SKIP_LOGIN === '1' || process.env.VITE_ERROR_SCREENSHOT_HARNESS === 'true';

const WIDTHS = [1440, 1024, 390];
/** X2, X4, X5–X11 (401= X5 … offline = X10; x11 = offline banner). */
const SCREENS = ['x2', 'x4', 'x11', '401', '403', '500', '502', '503', '429', 'offline'];

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => window.location.pathname.includes('/documents'), null, {
    timeout: 30_000,
  });
}

async function setTheme(page, theme) {
  await page.evaluate((mode) => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, theme);
}

async function capture(page, name, width, theme) {
  await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
  await setTheme(page, theme);
  const file = path.join(OUT, `${name}-${width}-${theme}.png`);
  await page.screenshot({ path: file, fullPage: width <= 390 });
  return file;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();
  if (!SKIP_LOGIN) {
    await login(page);
  }

  for (const screenId of SCREENS) {
    await page.goto(`${BASE}/docs/errors/previews/${screenId}`, { waitUntil: 'networkidle' });
    for (const width of WIDTHS) {
      for (const theme of ['light', 'dark']) {
        await capture(page, `error-${screenId}`, width, theme);
      }
    }
  }

  await browser.close();
  console.log(`Saved error screenshots under ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
