#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const OUT = process.env.SCREENSHOT_DIR ?? path.join(ROOT, 'docs', 'assets', 'screenshots');
const EMAIL = process.env.SEED_EMAIL ?? 'readme-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'ReadmeScreenshot1!';
const FIXTURE_PDF = path.join(ROOT, 'e2e/fixtures/synthetic-upload.pdf');
const FIXTURE_PHRASE = 'E2E_SYNTHETIC_FIXTURE_PHRASE_Q1';
const UPLOAD_TITLE = 'synthetic-upload.pdf';

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => window.location.pathname.includes('/documents'), null, {
    timeout: 60_000,
  });
}

async function setTheme(page, mode) {
  await page.locator('.user-account-menu-trigger').click();
  const label = mode === 'dark' ? /Dark theme|Dunkles Design/i : /Light theme|Helles Design/i;
  await page.getByRole('menuitem', { name: label }).click();
  await page.waitForTimeout(400);
}

async function setEnglish(page) {
  await page
    .getByRole('button', { name: /English|Englisch/i })
    .click({ timeout: 5000 })
    .catch(() => undefined);
  await page.waitForTimeout(300);
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, type: 'png' });
  return file;
}

/** Upload a born-digital PDF so MinIO + preview + extraction are real (no empty states). */
async function expandUploadDropzone(page) {
  const uploadBtn = page.getByRole('button', { name: /^upload$|^hochladen$/i });
  if (await uploadBtn.count()) {
    await uploadBtn.first().click();
  }
  await page
    .getByRole('region', { name: /upload documents|dokumente hochladen/i })
    .waitFor({ timeout: 30_000 });
}

async function uploadSyntheticDocument(page) {
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  await expandUploadDropzone(page);
  await page.locator('input[type="file"]').first().setInputFiles(FIXTURE_PDF);
  const docRow = page.getByRole('row').filter({ hasText: UPLOAD_TITLE });
  await docRow.waitFor({ state: 'visible', timeout: 90_000 });
  await docRow.locator('.badge-ready, .badge.badge-ready').waitFor({ timeout: 180_000 });
  await docRow.getByRole('link', { name: /^open$|^öffnen$/i }).click();
  await page.waitForURL(/\/documents\/[0-9a-f-]+/i, { timeout: 30_000 });
  const detailUrl = page.url();
  await page.getByRole('tab', { name: /^details$/i }).click();
  await page.getByText(/loading pdf/i).waitFor({ state: 'detached', timeout: 30_000 }).catch(() => undefined);
  await page.getByRole('region', { name: /^page 1$/i }).getByText(FIXTURE_PHRASE).waitFor({
    timeout: 60_000,
  });
  await page.locator('.pdf-page-canvas').first().waitFor({ state: 'visible', timeout: 90_000 });
  return detailUrl;
}

async function captureHero(page, theme) {
  await setTheme(page, theme);
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.library-page, .documents-table', { timeout: 30_000 });
  await shot(page, `hero-${theme}.png`);
}

async function captureLibrary(page) {
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  await shot(page, 'feature-library.png');
}

async function captureDetailDetailsTab(page, detailUrl) {
  await setTheme(page, 'light');
  await page.goto(detailUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('.document-detail-page', { timeout: 30_000 });
  await page.getByRole('tab', { name: /^details$/i }).click();
  await page.locator('.pdf-page-canvas').first().waitFor({ state: 'visible', timeout: 90_000 });
  await page.getByRole('region', { name: /^page 1$/i }).getByText(FIXTURE_PHRASE).waitFor({
    timeout: 30_000,
  });
  await shot(page, 'feature-document-detail.png');
}

async function captureLabels(page) {
  await page.goto(`${BASE}/structure/labels`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.labels-todo-panel, .labels-vocabulary-card', { timeout: 30_000 });
  await shot(page, 'feature-labels.png');
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  const page = await context.newPage();
  await login(page);
  await setEnglish(page);

  const detailUrl = await uploadSyntheticDocument(page);

  await captureHero(page, 'light');
  await captureHero(page, 'dark');
  await captureLibrary(page);
  await captureDetailDetailsTab(page, detailUrl);
  await captureLabels(page);

  await browser.close();
  await writeFile(path.join(OUT, '.generated'), `${new Date().toISOString()}\n`, 'utf8');
  console.log(`Screenshots written to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
