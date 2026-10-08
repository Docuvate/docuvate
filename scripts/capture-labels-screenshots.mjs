#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const OUT = process.env.SCREENSHOT_DIR ?? '/opt/cursor/artifacts';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';

async function sha256(path) {
  const buf = await readFile(path);
  return createHash('sha256').update(buf).digest('hex');
}

async function login(page, locale) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => window.location.pathname.includes('/documents'), null, {
    timeout: 30_000,
  });
  if (locale === 'de') {
    await page.getByRole('button', { name: 'Deutsch' }).click({ timeout: 5000 }).catch(() => undefined);
  } else {
    await page.getByRole('button', { name: 'English' }).click({ timeout: 5000 }).catch(() => undefined);
  }
}

async function gotoLabels(page) {
  await page.goto(`${BASE}/structure/labels`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.labels-todo-panel, .labels-vocabulary-card', { timeout: 20_000 });
}

async function captureLabelsFull(page, outPath) {
  await gotoLabels(page);
  await page.screenshot({ path: outPath, fullPage: true });
}

async function openVocabularyDeleteDialog(page, labelName) {
  await gotoLabels(page);
  const row = page
    .locator('.labels-vocabulary-table tbody tr')
    .filter({ has: page.locator('.chip-label', { hasText: labelName, exact: true }) })
    .first();
  await row.locator('.labels-overflow-btn').click();
  await page.locator('.context-menu-root').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('.context-menu-root').getByRole('menuitem', { name: 'Löschen' }).click();
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 5000 });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const deContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'de-DE',
  });
  await deContext.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'de');
    document.documentElement.setAttribute('data-docuvate-theme', 'light');
  });
  const dePage = await deContext.newPage();
  await login(dePage, 'de');
  await captureLabelsFull(dePage, `${OUT}/labels-page-de-light.png`);

  const coverageBlock = dePage.locator('.labels-coverage-block').first();
  if ((await coverageBlock.count()) > 0) {
    await coverageBlock.scrollIntoViewIfNeeded();
    await coverageBlock.screenshot({ path: `${OUT}/labels-coverage-kpi.png` });
  }

  const assignRow = dePage.locator('.labels-todo-row').filter({ hasText: 'Label zuweisen' }).first();
  if ((await assignRow.count()) > 0) {
    await assignRow.scrollIntoViewIfNeeded();
    await assignRow.screenshot({ path: `${OUT}/labels-assign-suggestion-card.png` });
  }

  const mergeRow = dePage.locator('.labels-todo-row').filter({ hasText: 'Zusammenführen' }).first();
  if ((await mergeRow.count()) > 0) {
    await mergeRow.scrollIntoViewIfNeeded();
    await mergeRow.screenshot({ path: `${OUT}/labels-merge-suggestion-card.png` });
  }

  const todoOverflow = dePage.locator('.labels-todo-row .labels-overflow-btn').first();
  if ((await todoOverflow.count()) > 0) {
    await todoOverflow.click();
    await dePage.locator('.context-menu-root').waitFor({ state: 'visible', timeout: 5000 });
    await dePage.screenshot({ path: `${OUT}/labels-todo-overflow-menu.png`, fullPage: true });
    await dePage.keyboard.press('Escape');
  }

  await openVocabularyDeleteDialog(dePage, 'SEPA Lastschriftmandat');
  await dePage.screenshot({ path: `${OUT}/labels-vocabulary-delete-confirm-one.png`, fullPage: true });
  await dePage.getByRole('button', { name: 'Abbrechen' }).click();
  await dePage.getByRole('dialog').waitFor({ state: 'hidden', timeout: 5000 });

  await openVocabularyDeleteDialog(dePage, 'Rechnung');
  await dePage.screenshot({ path: `${OUT}/labels-vocabulary-delete-confirm-many.png`, fullPage: true });
  await dePage.getByRole('button', { name: 'Abbrechen' }).click();

  await dePage.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  const titleOnlyRow = dePage.locator('tr').filter({ hasText: 'Selbstauskunft_Muster_GmbH.pdf' }).first();
  await titleOnlyRow.scrollIntoViewIfNeeded();
  await titleOnlyRow.screenshot({ path: `${OUT}/labels-document-list-no-duplicate-filename.png` });

  await dePage.evaluate(() => {
    document.documentElement.setAttribute('data-docuvate-theme', 'dark');
    window.localStorage.setItem('docuvate-theme', 'dark');
  });
  await dePage.reload({ waitUntil: 'networkidle' });
  await gotoLabels(dePage);
  await dePage.screenshot({ path: `${OUT}/labels-page-de-dark.png`, fullPage: true });

  await dePage.getByRole('link', { name: 'Ohne Label anzeigen' }).click();
  await dePage.waitForURL(/\/documents/);
  await dePage.screenshot({ path: `${OUT}/documents-without-label-filter.png`, fullPage: true });
  await deContext.close();

  const enContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  await enContext.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    document.documentElement.setAttribute('data-docuvate-theme', 'light');
  });
  const enPage = await enContext.newPage();
  await login(enPage, 'en');
  await captureLabelsFull(enPage, `${OUT}/labels-page-en-light.png`);
  await enContext.close();

  await browser.close();

  const mergePath = `${OUT}/labels-merge-suggestion-card.png`;
  const darkPath = `${OUT}/labels-page-de-dark.png`;
  try {
    const mergeHash = await sha256(mergePath);
    const darkHash = await sha256(darkPath);
    if (mergeHash === darkHash) {
      console.error('FAIL: merge card screenshot is byte-identical to de-dark full page');
      process.exit(1);
    }
    console.log('OK: merge card differs from de-dark page (merge=%s… dark=%s…)', mergeHash.slice(0, 12), darkHash.slice(0, 12));
  } catch (err) {
    console.warn('Byte check skipped:', err.message);
  }

  console.log('Saved screenshots to', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
