#!/usr/bin/env node
/** Post-rebase screenshot set for #72 review. */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const OUT = process.env.SCREENSHOT_DIR ?? '/opt/cursor/artifacts';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';
const EXPECT_SHA = process.env.EXPECT_GIT_SHA ?? '';

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

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => window.location.pathname.includes('/documents'), null, {
    timeout: 30_000,
  });
}

async function clip(page, path, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.screenshot({ path, clip: { x: 0, y: 0, width, height: 900 } });
}

async function seed(page) {
  const res = await page.evaluate(async (fields) => {
    const r = await fetch('/api/v1/recognized-fields', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fields }),
    });
    return r.ok;
  }, SEED_FIELDS);
  if (!res) throw new Error('seed failed');
}

async function prepareRecognizedFields(page) {
  await seed(page);
  await page.goto(`${BASE}/structure/recognized-fields`, { waitUntil: 'networkidle' });
}

async function setDefaultsOpen(page, open) {
  const panel = page.locator('.recognized-fields-defaults-panel');
  await panel.evaluate((el, wantOpen) => {
    if (el instanceof HTMLDetailsElement) {
      el.open = wantOpen;
    }
  }, open);
  await page.waitForFunction(
    (wantOpen) => {
      const el = document.querySelector('.recognized-fields-defaults-panel');
      return el instanceof HTMLDetailsElement && el.open === wantOpen;
    },
    open,
    { timeout: 5000 }
  );
}

async function chevronZoomCropHiRes(page, browser, outPath) {
  const chevron = page.locator('.recognized-fields-defaults-chevron').first();
  await chevron.waitFor({ state: 'visible' });
  const box = await chevron.boundingBox();
  if (!box) {
    throw new Error('chevron bounding box missing');
  }
  const open = await page.evaluate(() => {
    const el = document.querySelector('.recognized-fields-defaults-panel');
    return el instanceof HTMLDetailsElement && el.open;
  });
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  const hi = await browser.newContext({
    locale: 'de-DE',
    viewport,
    deviceScaleFactor: 4,
  });
  await hi.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'de');
    document.documentElement.setAttribute('data-docuvate-theme', 'light');
  });
  const cookies = await page.context().cookies();
  await hi.addCookies(cookies);
  const hiPage = await hi.newPage();
  await hiPage.goto(page.url(), { waitUntil: 'networkidle' });
  await hiPage.locator('.recognized-fields-defaults-panel').evaluate((el, wantOpen) => {
    if (el instanceof HTMLDetailsElement) {
      el.open = wantOpen;
    }
  }, open);
  const hiBox = await hiPage.locator('.recognized-fields-defaults-chevron').first().boundingBox();
  if (!hiBox) {
    await hi.close();
    throw new Error('hi-res chevron box missing');
  }
  const cx = hiBox.x + hiBox.width / 2;
  const cy = hiBox.y + hiBox.height / 2;
  const half = 18;
  await hiPage.screenshot({
    path: outPath,
    animations: 'disabled',
    clip: { x: cx - half, y: cy - half, width: half * 2, height: half * 2 },
  });
  await hi.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const de = await browser.newContext({ locale: 'de-DE', viewport: { width: 1440, height: 900 } });
  await de.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'de');
    document.documentElement.setAttribute('data-docuvate-theme', 'light');
  });
  const dePage = await de.newPage();
  await login(dePage);
  const sha = await dePage.evaluate(() => window.__DOCUVATE_BUILD_SHA__ ?? 'unknown');
  if (EXPECT_SHA && !String(sha).startsWith(EXPECT_SHA)) {
    throw new Error(`SHA mismatch: ${sha} vs ${EXPECT_SHA}`);
  }
  await prepareRecognizedFields(dePage);

  await setDefaultsOpen(dePage, true);
  await clip(dePage, `${OUT}/rf-de-light-1440.png`, 1440);
  await chevronZoomCropHiRes(dePage, browser, `${OUT}/rf-de-light-1440-chev-open.png`);

  await setDefaultsOpen(dePage, false);
  await clip(dePage, `${OUT}/rf-de-light-1440-closed.png`, 1440);
  await chevronZoomCropHiRes(dePage, browser, `${OUT}/rf-de-light-1440-chev-closed.png`);
  await de.close();

  await browser.close();
  console.log('build_sha:', sha);
  console.log('Saved to', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
