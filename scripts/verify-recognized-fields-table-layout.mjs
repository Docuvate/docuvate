#!/usr/bin/env node
/**
 * Recognized-fields table: no horizontal overflow; delete control visible inside catalog card.
 */
import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';

const FIELDS_DE = [
  { key: 'rechnungsnummer', label: 'Rechnungsnummer', fieldType: 'text', extractForAllDocuments: true, sortOrder: 0 },
  { key: 'rechnungsdatum', label: 'Rechnungsdatum', fieldType: 'date', extractForAllDocuments: true, sortOrder: 1 },
  { key: 'betrag', label: 'Betrag', fieldType: 'currency', extractForAllDocuments: true, sortOrder: 2 },
  { key: 'kundennummer', label: 'Kundennummer', fieldType: 'text', extractForAllDocuments: true, sortOrder: 3 },
  { key: 'vertragsnummer', label: 'Vertragsnummer', fieldType: 'text', extractForAllDocuments: true, sortOrder: 4 },
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

async function seedFields(page, fields) {
  const res = await page.evaluate(async (items) => {
    const r = await fetch('/api/v1/recognized-fields', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fields: items }),
    });
    return { ok: r.ok, status: r.status };
  }, fields);
  if (!res.ok) {
    throw new Error(`Seed failed ${res.status}`);
  }
}

async function assertTableLayout(page, viewportWidth) {
  await page.setViewportSize({ width: viewportWidth, height: 900 });
  await page.goto(`${BASE}/structure/recognized-fields`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.recognized-fields-table tbody tr', { timeout: 20_000 });

  const metrics = await page.evaluate(() => {
    const card = document.querySelector('.recognized-fields-catalog-card');
    const table = document.querySelector('.recognized-fields-table');
    const wrap = document.querySelector('.recognized-fields-table-wrap');
    const deleteBtn = document.querySelector(
      '.recognized-fields-table .recognized-fields-icon-btn[aria-label]'
    );
    const labelCell = document.querySelector(
      '.recognized-fields-table tbody tr:not(.recognized-fields-table__editor-row) .recognized-fields-table__cell--label .recognized-fields-table__primary'
    );
    if (!card || !table || !deleteBtn || !labelCell) {
      return null;
    }
    const cardRect = card.getBoundingClientRect();
    const deleteRect = deleteBtn.getBoundingClientRect();
    const target = wrap ?? table;
    return {
      tableScrollWidth: target.scrollWidth,
      tableClientWidth: target.clientWidth,
      labelText: labelCell.textContent?.trim(),
      labelIncludesEllipsis: (labelCell.textContent ?? '').includes('…'),
      deleteVisible:
        deleteRect.width > 0 &&
        deleteRect.height > 0 &&
        deleteRect.right <= cardRect.right + 1 &&
        deleteRect.left >= cardRect.left - 1,
      defaultsBelowCatalog: (() => {
        const catalog = document.querySelector('.recognized-fields-catalog-card');
        const panel = document.querySelector('.recognized-fields-defaults-panel');
        if (!catalog || !panel) return true;
        return panel.getBoundingClientRect().top >= catalog.getBoundingClientRect().bottom - 2;
      })(),
    };
  });

  if (!metrics) {
    throw new Error('Could not measure recognized-fields table');
  }
  console.log(`viewport=${viewportWidth}px`, JSON.stringify(metrics));

  if (metrics.tableScrollWidth > metrics.tableClientWidth) {
    throw new Error(
      `Table overflows (${metrics.tableScrollWidth} > ${metrics.tableClientWidth}) at ${viewportWidth}px`
    );
  }
  if (metrics.labelIncludesEllipsis || metrics.labelText !== 'Rechnungsnummer') {
    throw new Error(`Field label truncated or wrong at ${viewportWidth}px: "${metrics.labelText}"`);
  }
  if (!metrics.deleteVisible) {
    throw new Error(`Delete control not fully inside catalog card at ${viewportWidth}px`);
  }
  if (viewportWidth < 1180 && !metrics.defaultsBelowCatalog) {
    throw new Error(`Defaults panel should stack below catalog at ${viewportWidth}px`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'de-DE', viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'de');
    document.documentElement.setAttribute('data-docuvate-theme', 'light');
  });
  const page = await context.newPage();
  await login(page);
  await seedFields(page, FIELDS_DE);
  for (const w of [1024, 1280, 1440]) {
    await assertTableLayout(page, w);
  }
  await context.close();
  await browser.close();
  console.log('VERIFY OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
