#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Locale segmented control (login shell) at 1440px — light + dark, for PR artifacts.
 * Prereq: `pnpm --filter @docuvate/web preview` on SCREENSHOT_BASE_URL (default :4173).
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:4173';
const OUT = process.env.SCREENSHOT_DIR
  ? path.resolve(process.env.SCREENSHOT_DIR)
  : '.artifacts/segmented-locale-style';

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('docuvate-theme-preference', t);
    document.documentElement.setAttribute('data-docuvate-theme', t);
  }, theme);
}

async function captureLocaleSegment(page, fileName) {
  const segment = page.locator('.locale-switcher-wrap .segmented-control').first();
  await segment.waitFor({ state: 'visible', timeout: 30_000 });
  await page.screenshot({
    path: path.join(OUT, fileName),
    clip: await segment.boundingBox(),
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await setTheme(page, 'light');
  await captureLocaleSegment(page, 'locale-segment-after-light.png');
  await setTheme(page, 'dark');
  await captureLocaleSegment(page, 'locale-segment-after-dark.png');
  await browser.close();
  console.log('wrote', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
