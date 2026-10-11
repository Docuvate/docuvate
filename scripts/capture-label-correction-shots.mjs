#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE_URL ?? 'http://localhost:5173';
const OUT = process.env.E2E_ARTIFACT_DIR ?? '/opt/cursor/artifacts/screenshots';
const WIDTHS = [1440, 1024];

async function capture(width, suffix) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  const link = page.locator('.library-doc-table-card a').first();
  if (await link.count() === 0) {
    await browser.close();
    return false;
  }
  await link.click();
  await page.getByRole('tab', { name: /labels/i }).click();
  await page.locator('.label-panel').waitFor({ state: 'visible' });
  const body = await page.screenshot({ fullPage: true });
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, `label-correction-${suffix}-${width}.png`), body);
  await browser.close();
  return true;
}

let ok = false;
for (const width of WIDTHS) {
  ok = (await capture(width, 'after')) || ok;
}
if (!ok) {
  console.warn('label-correction screenshots skipped (no documents or app unavailable)');
  process.exit(0);
}
console.log(`Wrote label correction screenshots to ${OUT}`);
