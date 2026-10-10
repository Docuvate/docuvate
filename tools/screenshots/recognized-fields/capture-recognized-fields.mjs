#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Capture document detail: recognized catalog fields + heuristic suggestions (localized).
 */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const EXPECT_SHA = execSync(`git -C ${REPO_ROOT} rev-parse HEAD`).toString().trim();
const OUT =
  process.env.SCREENSHOT_DIR ??
  '/opt/cursor/artifacts/recognized-fields-screenshots';
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';

const WIDTHS = [390, 1440];
const THEMES = ['light', 'dark'];
const THEME_PREF_KEY = 'docuvate-theme-preference';
const THEME_COMPACT_KEY = 'docuvate-theme';

/** Catalog without `absender` so vendor line stays a suggestion, not a recognized row. */
const RECOGNIZED_CATALOG = [
  { key: 'rechnungsnummer', label: 'Rechnungsnummer', fieldType: 'text', extractForAllDocuments: true, sortOrder: 0 },
  { key: 'rechnungsdatum', label: 'Rechnungsdatum', fieldType: 'date', extractForAllDocuments: true, sortOrder: 1 },
  { key: 'betrag', label: 'Betrag', fieldType: 'currency', extractForAllDocuments: true, sortOrder: 2 },
  { key: 'iban', label: 'IBAN', fieldType: 'text', extractForAllDocuments: true, sortOrder: 3 },
];

const FIXTURE_TEXT = `Rechnung Demo
Rechnungsnummer: INV-2026-0042
Rechnungsdatum: 15.03.2026
Closed-Form Document Layout Classification
Thomas Faust
Kurzer Absender: Demo Nord GmbH
Bruttobetrag: 12.500,00 EUR`;

function md5(buf) {
  return createHash('md5').update(buf).digest('hex');
}

async function assertBuildSha(page) {
  const sha = await page.evaluate(() => window.__DOCUVATE_BUILD_SHA__ ?? '');
  if (sha !== EXPECT_SHA) {
    throw new Error(`stale web build: expected ${EXPECT_SHA}, got ${sha || '(empty)'}`);
  }
}

async function prepareTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate(
    ([prefKey, compactKey, pref]) => {
      localStorage.setItem(prefKey, pref);
      localStorage.setItem(compactKey, pref);
      document.documentElement.setAttribute('data-docuvate-theme', pref);
      window.dispatchEvent(new CustomEvent('docuvate-theme-preference-change'));
    },
    [THEME_PREF_KEY, THEME_COMPACT_KEY, theme]
  );
  const attr = await page.evaluate(() => document.documentElement.getAttribute('data-docuvate-theme'));
  if (attr !== theme) throw new Error(`theme attr ${attr} != ${theme}`);
}

async function seedRecognizedCatalog(page) {
  const res = await page.request.put(`${BASE}/api/v1/recognized-fields`, {
    data: { fields: RECOGNIZED_CATALOG },
  });
  if (!res.ok()) {
    throw new Error(`seed recognized-fields failed: ${res.status()} ${await res.text()}`);
  }
}

async function waitForDocumentReady(page, id) {
  for (let i = 0; i < 120; i++) {
    const st = await (await page.request.get(`${BASE}/api/v1/documents/${id}`)).json();
    if (st.status === 'ready') return;
    if (st.status === 'failed') throw new Error('extraction failed');
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('document not ready in time');
}

async function assertRecognizedAndSuggestion(page) {
  await page.locator('.layout-side-panel .layout-field-list .layout-field-row').first().waitFor({
    timeout: 120_000,
  });
  const recognizedCount = await page.locator('.layout-side-panel .layout-field-list .layout-field-row').count();
  if (recognizedCount < 1) {
    throw new Error(`expected ≥1 recognized catalog field row, got ${recognizedCount}`);
  }
  const absenderSuggestion = page
    .locator('.layout-side-panel .layout-field-suggestion')
    .filter({ has: page.locator('.layout-field-label', { hasText: /^Absender$/i }) });
  await absenderSuggestion.first().waitFor({ state: 'visible', timeout: 120_000 });
}

async function captureShot(page, docUrl, filePath, width, theme) {
  const height = width <= 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await prepareTheme(page, theme);
  await page.goto(docUrl, { waitUntil: 'networkidle' });
  await assertBuildSha(page);
  await assertRecognizedAndSuggestion(page);
  if (width <= 390) {
    await page.locator('.layout-side-panel').scrollIntoViewIfNeeded();
  }
  await page.screenshot({ path: filePath, fullPage: width > 390 });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();
  const origin = new URL(BASE).origin;
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  const signIn = await page.request.post(`${BASE}/api/auth/sign-in/email`, {
    headers: { Origin: origin, Referer: `${origin}/login` },
    data: { email: EMAIL, password: PASSWORD },
  });
  if (!signIn.ok()) {
    throw new Error(`sign-in failed: ${signIn.status()} ${await signIn.text()}`);
  }
  await seedRecognizedCatalog(page);

  const pdfBytes = await page.evaluate(async (text) => {
    const { PDFDocument, StandardFonts } = await import(
      'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm'
    );
    const doc = await PDFDocument.create();
    const pdfPage = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const lines = text.split('\n');
    let y = 700;
    for (const line of lines) {
      pdfPage.drawText(line, { x: 72, y, size: 14, font });
      y -= 28;
    }
    const bytes = await doc.save();
    return Array.from(bytes);
  }, FIXTURE_TEXT);
  const buffer = Buffer.from(pdfBytes);
  const create = await page.request.post(`${BASE}/api/v1/documents`, {
    multipart: {
      file: { name: 'invoice-vendor-suggestion.pdf', mimeType: 'application/pdf', buffer },
    },
  });
  const { id } = await create.json();
  await waitForDocumentReady(page, id);
  const docUrl = `${BASE}/documents/${id}`;
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  await page.goto(docUrl, { waitUntil: 'networkidle' });
  await assertBuildSha(page);
  await assertRecognizedAndSuggestion(page);

  const files = [];
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      const name = `recognized-and-suggestion-de-${width}-${theme}.png`;
      const filePath = path.join(OUT, name);
      await captureShot(page, docUrl, filePath, width, theme);
      files.push({ name, width, theme, md5: md5(await readFile(filePath)) });
    }
  }

  for (const width of WIDTHS) {
    const light = files.find((f) => f.width === width && f.theme === 'light');
    const dark = files.find((f) => f.width === width && f.theme === 'dark');
    if (light?.md5 === dark?.md5) {
      throw new Error(`light and dark screenshots identical at ${width}px`);
    }
  }
  const distinct = new Set(files.map((f) => f.md5));
  if (distinct.size !== files.length) {
    throw new Error('duplicate screenshot checksums across variants');
  }

  await writeFile(
    path.join(OUT, 'capture-manifest.json'),
    JSON.stringify(
      {
        buildSha: EXPECT_SHA,
        documentId: id,
        capturedAt: new Date().toISOString(),
        files: files.map(({ name, width, theme, md5 }) => ({ name, width, theme, md5 })),
        recognizedCatalogKeys: RECOGNIZED_CATALOG.map((f) => f.key),
        suggestionLabel: 'Absender',
      },
      null,
      2
    )
  );
  console.log(`Captured ${files.length} recognized-fields screenshots to ${OUT} (build ${EXPECT_SHA})`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
