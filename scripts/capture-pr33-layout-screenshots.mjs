#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * PR #33 document layout workspace screenshots.
 * Output: /opt/cursor/artifacts/pr33-screenshots/{state}-{width}-{theme}.png
 */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.PR33_SCREENSHOT_OUT ?? '/opt/cursor/artifacts/pr33-screenshots';
const FIXTURES = process.env.PR33_FIXTURES_DIR ?? path.join(OUT, 'fixtures');
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';

const WIDTHS = [390, 1024, 1440];
const THEMES = ['light', 'dark'];
const THEME_PREF_KEY = 'docuvate-theme-preference';
const THEME_COMPACT_KEY = 'docuvate-theme';

const hashes = new Map();

function md5File(buf) {
  return createHash('md5').update(buf).digest('hex');
}

async function recordScreenshot(filePath) {
  const buf = await readFile(filePath);
  const hash = md5File(buf);
  const prior = hashes.get(hash);
  if (prior) {
    throw new Error(`duplicate screenshot hash ${hash}: ${path.basename(filePath)} == ${path.basename(prior)}`);
  }
  hashes.set(hash, filePath);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => window.location.pathname.includes('/documents'), null, {
    timeout: 45_000,
  });
}

async function assertTheme(page, theme) {
  const attr = await page.evaluate(() => document.documentElement.getAttribute('data-docuvate-theme'));
  if (attr !== theme) {
    throw new Error(`expected data-docuvate-theme=${theme}, got ${attr}`);
  }
}

async function prepareTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate(
    ([prefKey, compactKey, pref]) => {
      localStorage.setItem(prefKey, pref);
      localStorage.setItem(compactKey, pref);
      document.documentElement.setAttribute('data-docuvate-theme', pref);
    },
    [THEME_PREF_KEY, THEME_COMPACT_KEY, theme]
  );
  await page.reload({ waitUntil: 'networkidle' });
  await assertTheme(page, theme);
}

async function uploadPdf(page, filePath) {
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  const fileInput = page.getByLabel(/choose files|dateien ausw/i);
  if ((await fileInput.count()) === 0) {
    await page.getByRole('button', { name: /^upload$|^hochladen$/i }).click();
  }
  await fileInput.first().setInputFiles(filePath);
  const row = page.getByRole('row').filter({ hasText: path.basename(filePath) });
  await row.waitFor({ state: 'visible', timeout: 120_000 });
  await row.locator('.badge-ready, .badge.badge-ready').waitFor({ timeout: 300_000 });
  const link = row.locator('a.library-open-doc-btn, a[href*="/documents/"]').first();
  const href = await link.getAttribute('href');
  if (!href) throw new Error(`no doc link for ${filePath}`);
  return href;
}

async function openDoc(page, href) {
  await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle' });
  await page.locator('.layout-workspace, .pdf-page-canvas').first().waitFor({ timeout: 120_000 });
  await page.locator('.pdf-page-canvas').first().waitFor({ state: 'visible', timeout: 120_000 });
}

async function waitLayoutPanel(page) {
  await page.locator('.layout-side-panel').waitFor({ timeout: 120_000 });
}

async function captureState(page, stateName, beforeShot) {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      await prepareTheme(page, theme);
      const height = width <= 390 ? 844 : Math.max(900, Math.round(width * 0.72));
      await page.setViewportSize({ width, height });
      if (beforeShot) {
        await beforeShot(page, width);
      }
      await page.waitForTimeout(350);
      const outName = `${stateName}-${width}-${theme}.png`;
      const outPath = path.join(OUT, outName);
      await page.screenshot({ path: outPath, fullPage: true });
      await recordScreenshot(outPath);
    }
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();

  await login(page);

  const bruttoHref = await uploadPdf(page, path.join(FIXTURES, 'brutto-field.pdf'));
  const landscapeHref = await uploadPdf(page, path.join(FIXTURES, 'landscape.pdf'));
  const scannedHref = await uploadPdf(page, path.join(FIXTURES, 'scanned-ocr.pdf'));
  const multipageHref = await uploadPdf(page, path.join(FIXTURES, 'multipage.pdf'));

  await writeFile(
    path.join(OUT, 'doc-hrefs.json'),
    JSON.stringify({ bruttoHref, landscapeHref, scannedHref, multipageHref }, null, 2)
  );

  await openDoc(page, bruttoHref);
  await waitLayoutPanel(page);
  await page.getByRole('tab', { name: /^felder$/i }).click();
  await page.getByText(/vorschlag/i).first().waitFor({ timeout: 60_000 });
  await captureState(page, '01-felder-vorschlag', async (p, width) => {
    if (width <= 390) {
      await p.locator('.layout-side-panel').scrollIntoViewIfNeeded();
    }
  });

  await openDoc(page, bruttoHref);
  await waitLayoutPanel(page);
  const fieldOverlay = page.locator('.pdf-layout-overlay-field').first();
  await fieldOverlay.waitFor({ state: 'visible', timeout: 30_000 });
  await fieldOverlay.hover();
  await page.locator('.layout-overlay-popover').waitFor({ state: 'visible', timeout: 15_000 });
  await captureState(page, '02-overlay-popover', async (p, width) => {
    const overlay = p.locator('.pdf-layout-overlay-field').first();
    await overlay.hover();
    await p.locator('.layout-overlay-popover').waitFor({ state: 'visible', timeout: 15_000 });
    if (width <= 390) {
      await p.locator('.layout-overlay-popover').scrollIntoViewIfNeeded();
    }
  });

  await openDoc(page, scannedHref);
  await waitLayoutPanel(page);
  await page.getByRole('button', { name: /^nachbau$/i }).click();
  await page.getByText(/nicht verlässlich/i).first().waitFor({ state: 'visible', timeout: 120_000 });
  await captureState(page, '03-nachbau-unreliable');

  await openDoc(page, landscapeHref);
  await waitLayoutPanel(page);
  await captureState(page, '04-landscape');

  await openDoc(page, scannedHref);
  await waitLayoutPanel(page);
  await page.locator('.pdf-layout-overlay').first().waitFor({ state: 'visible', timeout: 60_000 });
  await captureState(page, '05-scanned');

  await openDoc(page, multipageHref);
  await waitLayoutPanel(page);
  await page.getByRole('tab', { name: /^gliederung$/i }).click();
  await page.locator('.layout-outline-item').first().click();
  await page
    .locator('.layout-outline-item-active, .pdf-layout-overlay-active')
    .first()
    .waitFor({ timeout: 30_000 });
  await captureState(page, '06-gliederung-jump', async (p, width) => {
    if (width <= 390) {
      await p.locator('.layout-side-panel').scrollIntoViewIfNeeded();
    }
  });

  const lightSample = await readFile(path.join(OUT, '01-felder-vorschlag-1440-light.png'));
  const darkSample = await readFile(path.join(OUT, '01-felder-vorschlag-1440-dark.png'));
  if (md5File(lightSample) === md5File(darkSample)) {
    throw new Error('light and dark themes produced identical 01-felder-vorschlag at 1440');
  }

  await browser.close();
  console.log(`Captured ${hashes.size} unique screenshots in ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
