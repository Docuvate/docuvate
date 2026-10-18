#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Light/dark 1440 screenshots of main app surfaces (global token sanity).
 */
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const EXPECT_SHA = execSync('git -C ' + REPO_ROOT + ' rev-parse HEAD').toString().trim();
const OUT = process.env.SCREENSHOT_DIR
  ? path.resolve(process.env.SCREENSHOT_DIR)
  : '/opt/cursor/artifacts/app-screenshots';
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';

const SCREENS = [
  { id: 'start', path: '/' },
  { id: 'documents', path: '/documents' },
  { id: 'labels', path: '/structure/labels' },
  { id: 'chat', path: '/chat' },
  { id: 'settings', path: '/settings' },
];

async function login(page) {
  const origin = new URL(BASE).origin;
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  const res = await page.request.post(`${BASE}/api/auth/sign-in/email`, {
    headers: { Origin: origin, Referer: `${origin}/login` },
    data: { email: EMAIL, password: PASSWORD },
  });
  if (!res.ok()) throw new Error(`sign-in failed: ${res.status()}`);
}

async function prepareTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((pref) => {
    localStorage.setItem('docuvate-theme-preference', pref);
    localStorage.setItem('docuvate-theme', pref);
    document.documentElement.setAttribute('data-docuvate-theme', pref);
    window.dispatchEvent(new CustomEvent('docuvate-theme-preference-change'));
  }, theme);
}

async function captureScreen(page, screenPath, outFile) {
  await page.goto(`${BASE}${screenPath}`, { waitUntil: 'networkidle' });
  const sha = await page.evaluate(() => window.__DOCUVATE_BUILD_SHA__ ?? '');
  if (sha !== EXPECT_SHA) {
    throw new Error(`stale build on ${screenPath}: expected ${EXPECT_SHA}, got ${sha}`);
  }
  const height = await page.evaluate(() => {
    const main = document.querySelector('.app-main') ?? document.documentElement;
    return Math.min(Math.max(main.scrollHeight + 32, 900), 12000);
  });
  await page.setViewportSize({ width: 1440, height });
  await page.waitForTimeout(300);
  await page.screenshot({ path: outFile, fullPage: false });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();
  await login(page);

  for (const theme of ['light', 'dark']) {
    await prepareTheme(page, theme);
    for (const screen of SCREENS) {
      const outFile = path.join(OUT, `${screen.id}-1440-${theme}.png`);
      await captureScreen(page, screen.path, outFile);
    }
  }

  await browser.close();
  console.log(`App screenshots in ${OUT} (build ${EXPECT_SHA})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
