#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Capture document detail: heuristic field suggestions with localized labels (no raw keys).
 */
import { chromium } from 'playwright';
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

const FIXTURE_TEXT = `Rechnung Demo
Closed-Form Document Layout Classification
with Certified Coarse-to-Fine Abstention
Thomas Faust
Kurzer Absender: Demo Nord GmbH
Bruttobetrag: 12.500,00 EUR`;

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ locale: 'de-DE' })).newPage();
  const origin = new URL(BASE).origin;
  await page.request.post(`${origin}/api/auth/sign-in/email`, {
    headers: { Origin: origin },
    data: { email: EMAIL, password: PASSWORD },
  });
  const pdfBytes = await page.evaluate(async (text) => {
    const { PDFDocument, StandardFonts } = await import(
      'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm'
    );
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const lines = text.split('\n');
    let y = 700;
    for (const line of lines) {
      page.drawText(line, { x: 72, y, size: 14, font });
      y -= 28;
    }
    const bytes = await doc.save();
    return Array.from(bytes);
  }, FIXTURE_TEXT);
  const buffer = Buffer.from(pdfBytes);
  const create = await page.request.post(`${BASE}/api/v1/documents`, {
    multipart: {
      file: { name: 'research-paper.pdf', mimeType: 'application/pdf', buffer },
    },
  });
  const { id } = await create.json();
  for (let i = 0; i < 120; i++) {
    const st = await (await page.request.get(`${BASE}/api/v1/documents/${id}`)).json();
    if (st.status === 'ready') break;
    if (st.status === 'failed') throw new Error('extraction failed');
    await new Promise((r) => setTimeout(r, 2000));
  }
  await page.goto(`${BASE}/documents/${id}`, { waitUntil: 'networkidle' });
  const sha = await page.evaluate(() => window.__DOCUVATE_BUILD_SHA__ ?? '');
  if (sha !== EXPECT_SHA && sha !== 'dev') {
    throw new Error(`stale web build: expected ${EXPECT_SHA}, got ${sha || '(empty)'}`);
  }
  await page.locator('.extracted-field-suggestions, .layout-field-suggestion').first().waitFor({
    timeout: 120_000,
  });
  const suggestion = page.locator('.extracted-field-suggestions .layout-field-suggestion, .layout-field-suggestion').first();
  await suggestion.waitFor({ state: 'visible', timeout: 120_000 });
  const label = await suggestion.locator('.layout-field-label').first().textContent();
  if (!label || label.toLowerCase() === 'vendor') {
    throw new Error(`expected localized suggestion label, got ${label ?? '(empty)'}`);
  }
  await page.screenshot({ path: path.join(OUT, 'field-suggestions-absender-de-1440.png'), fullPage: true });
  await writeFile(
    path.join(OUT, 'capture-manifest.json'),
    JSON.stringify({ buildSha: EXPECT_SHA, documentId: id, capturedAt: new Date().toISOString() }, null, 2)
  );
  console.log(`Captured recognized-fields screenshots to ${OUT} (build ${EXPECT_SHA})`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
