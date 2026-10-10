#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * UI review screenshots (1440×900, compose @ localhost:5173).
 * Evidence: status filter menu, label form, recognized fields, build SHA.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const OUT = process.env.SCREENSHOT_DIR ?? '/opt/cursor/artifacts';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';
const EXPECT_SHA = process.env.EXPECT_GIT_SHA ?? 'e3ca05e';

const SEED_FIELDS = [
  { key: 'rechnungsnummer', label: 'Rechnungsnummer', fieldType: 'text', extractForAllDocuments: true, sortOrder: 0 },
  { key: 'rechnungsdatum', label: 'Rechnungsdatum', fieldType: 'date', extractForAllDocuments: true, sortOrder: 1 },
  { key: 'betrag', label: 'Betrag', fieldType: 'currency', extractForAllDocuments: true, sortOrder: 2 },
  { key: 'absender', label: 'Absender', fieldType: 'text', extractForAllDocuments: true, sortOrder: 3 },
  { key: 'iban', label: 'IBAN', fieldType: 'text', extractForAllDocuments: true, sortOrder: 4 },
  { key: 'vertragsende', label: 'Vertragsende', fieldType: 'date', extractForAllDocuments: true, sortOrder: 5 },
  { key: 'kundennummer', label: 'Kundennummer', fieldType: 'text', extractForAllDocuments: true, sortOrder: 6 },
  { key: 'ust_idnr', label: 'USt-IdNr.', fieldType: 'text', extractForAllDocuments: true, sortOrder: 7 },
  { key: 'faelligkeitsdatum', label: 'Fälligkeitsdatum', fieldType: 'date', extractForAllDocuments: true, sortOrder: 8 },
  { key: 'vertragsnummer', label: 'Vertragsnummer', fieldType: 'text', extractForAllDocuments: true, sortOrder: 9 },
];

async function login(page, locale) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => window.location.pathname.includes('/documents'), null, {
    timeout: 30_000,
  });
  const langBtn = locale === 'de' ? 'Deutsch' : 'English';
  await page.getByRole('button', { name: langBtn }).click({ timeout: 5000 }).catch(() => undefined);
}

async function seedRecognizedFields(page) {
  const res = await page.evaluate(async (fields) => {
    const r = await fetch('/api/v1/recognized-fields', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fields }),
    });
    return { ok: r.ok, status: r.status, text: await r.text() };
  }, SEED_FIELDS);
  if (!res.ok) {
    throw new Error(`Seed recognized fields failed ${res.status}: ${res.text}`);
  }
}

async function assertBuildSha(page) {
  const sha = await page.evaluate(() => window.__DOCUVATE_BUILD_SHA__ ?? 'unknown');
  if (EXPECT_SHA && !String(sha).startsWith(EXPECT_SHA)) {
    throw new Error(`BUILD SHA mismatch: expected ${EXPECT_SHA}, got ${sha}`);
  }
  return sha;
}

async function clipApp(page, path, width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width, height: 900 },
  });
}

const SEED_FIELDS_EN = [
  { key: 'invoice_number', label: 'Invoice number', fieldType: 'text', extractForAllDocuments: true, sortOrder: 0 },
  { key: 'invoice_date', label: 'Invoice date', fieldType: 'date', extractForAllDocuments: true, sortOrder: 1 },
  { key: 'amount', label: 'Amount', fieldType: 'currency', extractForAllDocuments: true, sortOrder: 2 },
  { key: 'sender', label: 'Sender', fieldType: 'text', extractForAllDocuments: true, sortOrder: 3 },
  { key: 'iban', label: 'IBAN', fieldType: 'text', extractForAllDocuments: true, sortOrder: 4 },
  { key: 'contract_end', label: 'Contract end', fieldType: 'date', extractForAllDocuments: true, sortOrder: 5 },
  { key: 'customer_number', label: 'Customer number', fieldType: 'text', extractForAllDocuments: true, sortOrder: 6 },
  { key: 'vat_id', label: 'VAT ID', fieldType: 'text', extractForAllDocuments: true, sortOrder: 7 },
  { key: 'payment_due', label: 'Payment due', fieldType: 'date', extractForAllDocuments: true, sortOrder: 8 },
  { key: 'contract_number', label: 'Contract number', fieldType: 'text', extractForAllDocuments: true, sortOrder: 9 },
];

async function seedRecognizedFieldsWith(page, fields) {
  const res = await page.evaluate(async (items) => {
    const r = await fetch('/api/v1/recognized-fields', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fields: items }),
    });
    return { ok: r.ok, status: r.status, text: await r.text() };
  }, fields);
  if (!res.ok) {
    throw new Error(`Seed recognized fields failed ${res.status}: ${res.text}`);
  }
}

async function openNewLabelForm(page, newLabelButtonName) {
  await page.goto(`${BASE}/structure/labels`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: newLabelButtonName }).click();
  await page.waitForSelector('.label-editor-card', { timeout: 10_000 });
}

const ASSIGNMENT_MODE_INDEX = {
  never: 0,
  recommend: 1,
  inbox: 2,
  any: 3,
  all: 4,
  exact: 5,
  regex: 6,
};

async function setLabelAssignmentMode(page, mode) {
  const trigger = page.locator('.label-editor-card .custom-select-trigger').first();
  await trigger.click();
  await page.locator('.custom-select-menu-portal').waitFor({ state: 'visible', timeout: 5000 });
  const index = ASSIGNMENT_MODE_INDEX[mode];
  if (index == null) {
    throw new Error(`Unknown assignment mode ${mode}`);
  }
  await page.locator('.custom-select-menu-portal .custom-select-option').nth(index).click();
  await page.locator('.custom-select-menu-portal').waitFor({ state: 'hidden', timeout: 5000 });
}

async function captureLabelFormAssignment(page, outPath, width, { mode, newLabelButtonName }) {
  await openNewLabelForm(page, newLabelButtonName);
  await setLabelAssignmentMode(page, mode);
  await page.locator('.label-editor-actions').scrollIntoViewIfNeeded();
  await clipApp(page, outPath, width);
}

async function captureVocabularyTable(page, outPath, width) {
  await page.goto(`${BASE}/structure/labels`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.labels-vocabulary-table', { timeout: 20_000 });
  await page.locator('.labels-vocabulary-card').scrollIntoViewIfNeeded();
  await clipApp(page, outPath, width);
}

async function measureStatusMenu(page) {
  return page.evaluate(() => {
    const menu = document.querySelector('.custom-select-menu-portal');
    if (!menu) return null;
    const style = getComputedStyle(menu);
    const options = menu.querySelectorAll('.custom-select-option');
    const last = options[options.length - 1];
    const menuRect = menu.getBoundingClientRect();
    const lastRect = last?.getBoundingClientRect();
    return {
      optionCount: options.length,
      scrollHeight: menu.scrollHeight,
      clientHeight: menu.clientHeight,
      overflowY: style.overflowY,
      scrollableClass: menu.classList.contains('custom-select-menu-scrollable'),
      lastOptionBottom: lastRect?.bottom ?? null,
      menuBottom: menuRect.bottom,
      lastClipped: lastRect ? lastRect.bottom > menuRect.bottom + 0.5 : null,
    };
  });
}

async function captureLibraryStatusFilter(page, outPath) {
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.filter-status-select', { timeout: 20_000 });
  const trigger = page.locator('.filter-status-select .custom-select-trigger').first();
  await trigger.click();
  await page.locator('.custom-select-menu-portal').waitFor({ state: 'visible', timeout: 5000 });
  const metrics = await measureStatusMenu(page);
  console.log('library_status_menu:', JSON.stringify(metrics));
  if (metrics?.scrollableClass) {
    throw new Error('Status filter menu should not be scrollable for short list');
  }
  if (metrics?.lastClipped) {
    throw new Error('Last status option appears clipped');
  }
  await clipApp(page, outPath);
  await page.keyboard.press('Escape');
}

async function captureRecognizedFields(page, outPath, width = 1440) {
  await page.goto(`${BASE}/structure/recognized-fields`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.recognized-fields-catalog-card', { timeout: 20_000 });
  await clipApp(page, outPath, width);
}

async function captureHeaderSearch(page, outPath) {
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  const search = page.locator('.topbar-search input, header .global-search input').first();
  await search.waitFor({ state: 'visible', timeout: 10_000 });
  const contrast = await page.evaluate(() => {
    const input = document.querySelector('.topbar-search input');
    if (!input) return null;
    const style = getComputedStyle(input);
    const ph = style.getPropertyValue('--dv-color-header-input-placeholder') || style.color;
    const bg = style.backgroundColor;
    const theme = document.documentElement.getAttribute('data-docuvate-theme');
    return { placeholderToken: ph.trim(), background: bg, theme };
  });
  console.log('header_search_styles:', JSON.stringify(contrast));
  if (contrast?.theme === 'light' && !contrast.placeholderToken.includes('85deg')) {
    throw new Error(
      `light header search placeholder should use stone hue (85deg): ${JSON.stringify(contrast)}`
    );
  }
  await clipApp(page, outPath);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = {};

  const deContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'de-DE',
  });
  await deContext.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'de');
    document.documentElement.setAttribute('data-docuvate-theme', 'light');
    localStorage.setItem('docuvate-theme', 'light');
  });
  const dePage = await deContext.newPage();
  await login(dePage, 'de');
  await captureHeaderSearch(dePage, `${OUT}/header-search-de-light-1440.png`);
  report.buildSha = await assertBuildSha(dePage);
  await writeFile(`${OUT}/build-sha.txt`, `${report.buildSha}\n`);
  await seedRecognizedFields(dePage);
  await captureRecognizedFields(dePage, `${OUT}/rf-de-light-1440.png`, 1440);
  await captureRecognizedFields(dePage, `${OUT}/rf-de-light-1024.png`, 1024);
  await captureLabelFormAssignment(dePage, `${OUT}/label-form-never-de-light-1440.png`, 1440, {
    mode: 'never',
    newLabelButtonName: 'Neues Label',
  });
  await captureLabelFormAssignment(dePage, `${OUT}/label-form-word-de-light-1440.png`, 1440, {
    mode: 'any',
    newLabelButtonName: 'Neues Label',
  });
  await captureVocabularyTable(dePage, `${OUT}/labels-vocabulary-de-light-1440.png`, 1440);

  await dePage.evaluate(() => {
    document.documentElement.setAttribute('data-docuvate-theme', 'dark');
    localStorage.setItem('docuvate-theme', 'dark');
  });
  await dePage.reload({ waitUntil: 'networkidle' });
  await seedRecognizedFields(dePage);
  await captureRecognizedFields(dePage, `${OUT}/rf-de-dark-1440.png`, 1440);
  await captureRecognizedFields(dePage, `${OUT}/rf-de-dark-1024.png`, 1024);
  await deContext.close();

  const enContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'en-US',
  });
  await enContext.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    document.documentElement.setAttribute('data-docuvate-theme', 'light');
    localStorage.setItem('docuvate-theme', 'light');
  });
  const enPage = await enContext.newPage();
  await login(enPage, 'en');
  await seedRecognizedFieldsWith(enPage, SEED_FIELDS_EN);
  await captureRecognizedFields(enPage, `${OUT}/rf-en-light-1440.png`, 1440);
  await captureRecognizedFields(enPage, `${OUT}/rf-en-light-1024.png`, 1024);
  await captureLabelFormAssignment(enPage, `${OUT}/label-form-never-en-light-1440.png`, 1440, {
    mode: 'never',
    newLabelButtonName: 'New label',
  });
  await captureLabelFormAssignment(enPage, `${OUT}/label-form-word-en-light-1440.png`, 1440, {
    mode: 'any',
    newLabelButtonName: 'New label',
  });
  await captureVocabularyTable(enPage, `${OUT}/labels-vocabulary-en-light-1440.png`, 1440);
  await enPage.evaluate(() => {
    document.documentElement.setAttribute('data-docuvate-theme', 'dark');
    localStorage.setItem('docuvate-theme', 'dark');
  });
  await enPage.reload({ waitUntil: 'networkidle' });
  await seedRecognizedFieldsWith(enPage, SEED_FIELDS_EN);
  await captureRecognizedFields(enPage, `${OUT}/rf-en-dark-1440.png`, 1440);
  await captureRecognizedFields(enPage, `${OUT}/rf-en-dark-1024.png`, 1024);
  await enContext.close();

  await browser.close();
  await writeFile(`${OUT}/ui-review-screenshot-report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log('Saved screenshots to', OUT);
  console.log('build_sha:', report.buildSha);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
