import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  applyMarketingC1Theme,
  assertMarketingAccentNotBlue,
} from './marketing-c1-web-theme.mjs';

/** Capture labels-* for landing (#71 labels seed user). */
const siteScripts = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(siteScripts, '../../..');
const sitePublic =
  process.env.QA_SCREENSHOT_DIR ?? join(siteScripts, '..', 'qa-screenshots');
/** Must match API `WEB_ORIGIN` (default http://localhost:5173) for better-auth cookies. */
const webUrl = process.env.WEB_URL ?? 'http://localhost:5173';
const labelsEmail = process.env.LABELS_SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const labelsPassword = process.env.LABELS_SEED_PASSWORD ?? 'LabelsScreenshot1!';

mkdirSync(sitePublic, { recursive: true });

const locales = ['de', 'en'];
const themes = ['light', 'dark'];
const VIEWPORT = { width: 1440, height: 900 };
const DEVICE_SCALE = 2;

const SEED_ASSIGNMENTS = [
  { doc: 'Kontoauszug März 2024', tagDe: 'Finanzen', tagEn: 'Finanzen' },
  { doc: 'Lohnsteuerbescheinigung 2024', tagDe: 'Steuern', tagEn: 'Steuern' },
  { doc: 'Mietvertrag Garage', tagDe: 'Vertrag', tagEn: 'Vertrag' },
];

function localeInitScript(locale, theme) {
  const themeLiteral = theme ? JSON.stringify(theme) : 'null';
  return `(() => {
    localStorage.setItem('docuvate.locale', ${JSON.stringify(locale)});
    ${theme ? `localStorage.setItem('docuvate-theme', ${themeLiteral});
    document.documentElement.setAttribute('data-docuvate-theme', ${themeLiteral});` : ''}
    document.documentElement.lang = ${JSON.stringify(locale === 'de' ? 'de' : 'en')};
  })();`;
}

function launchChromiumForLocale(locale) {
  const lang = locale === 'de' ? 'de-DE' : 'en-US';
  return chromium.launch({
    args: [`--lang=${lang}`],
    env: {
      ...process.env,
      ...(locale === 'de'
        ? { LANG: 'de_DE.UTF-8', LC_ALL: 'de_DE.UTF-8' }
        : { LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }),
    },
  });
}

function themeMenuLabel(locale, theme) {
  if (locale === 'de') {
    return theme === 'dark' ? 'Dunkles Design' : 'Helles Design';
  }
  return theme === 'dark' ? 'Dark theme' : 'Light theme';
}

async function screenshotLabelsPage(page, path) {
  const clip = await page.evaluate(() => {
    const selectors = [
      '.page-header',
      '.labels-coverage-kpi',
      '.labels-todo-panel',
      '.labels-vocabulary-card',
    ];
    let top = Infinity;
    let left = Infinity;
    let bottom = 0;
    let right = 0;
    let found = false;
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        found = true;
        top = Math.min(top, r.top);
        left = Math.min(left, r.left);
        bottom = Math.max(bottom, r.bottom);
        right = Math.max(right, r.right);
      }
    }
    if (!found) return null;
    const pad = 8;
    return {
      x: Math.max(0, left - pad),
      y: Math.max(0, top - pad),
      width: right - left + pad * 2,
      height: bottom - top + pad * 2,
    };
  });
  if (!clip) {
    await page.locator('.page').first().screenshot({ path });
    return;
  }
  await page.screenshot({ path, clip });
}

async function loginLabels(page) {
  await page.goto(`${webUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.locator('input[type="email"]').fill(labelsEmail);
  await page.locator('input[type="password"]').fill(labelsPassword);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/documents/, { timeout: 60_000 });
  await page.waitForSelector('.library-layout, .page', { timeout: 30_000 });
}

async function applyThemeViaAccountMenu(page, locale, theme) {
  await page.locator('.user-account-menu-trigger').click();
  await page.getByRole('menuitem', { name: themeMenuLabel(locale, theme) }).click();
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
}

async function assertDarkBodyBackground(page) {
  const theme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-docuvate-theme')
  );
  if (theme !== 'dark') {
    throw new Error(`Expected data-docuvate-theme=dark after account menu, got "${theme}"`);
  }
  const darkEnough = await page.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return false;
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    return r <= 45 && g <= 45 && b <= 55;
  });
  if (!darkEnough) {
    throw new Error('Body background is not a dark theme color');
  }
}

async function assertLabelsSeedAssignments(page, locale) {
  const bodyText = await page.locator('.labels-todo-panel').innerText();
  for (const row of SEED_ASSIGNMENTS) {
    if (!bodyText.includes(row.doc)) {
      throw new Error(`Missing todo document "${row.doc}" in labels queue`);
    }
    const tag = locale === 'de' ? row.tagDe : row.tagEn;
    const rowLocator = page
      .locator('.labels-todo-row')
      .filter({ hasText: row.doc })
      .filter({ hasText: tag })
      .first();
    if ((await rowLocator.count()) === 0) {
      throw new Error(`Expected assign suggestion ${row.doc} → ${tag}`);
    }
  }
}

function runLabelsSeed() {
  if (process.env.SKIP_LABELS_SEED === '1') {
    return;
  }
  const seed = spawnSync('node', [join(repoRoot, 'scripts/seed-labels-screenshots.mjs')], {
    stdio: 'inherit',
    env: {
      ...process.env,
      AUTH_BASE: process.env.AUTH_BASE ?? 'http://127.0.0.1:3001',
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate',
      WEB_ORIGIN: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    },
  });
  if (seed.status !== 0) {
    throw new Error('seed-labels-screenshots.mjs failed');
  }
}

runLabelsSeed();

async function createLabelsAuthState(browser, locale) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    locale: locale === 'de' ? 'de-DE' : 'en-US',
    timezoneId: locale === 'de' ? 'Europe/Berlin' : 'America/New_York',
  });
  const page = await context.newPage();
  await page.addInitScript(localeInitScript(locale, 'light'));
  await loginLabels(page);
  if (locale === 'en') {
    await page.getByRole('button', { name: 'English' }).click({ timeout: 5000 }).catch(() => undefined);
    await page.waitForTimeout(400);
  }
  const storageState = await context.storageState();
  await context.close();
  return storageState;
}

for (const locale of locales) {
  const browser = await launchChromiumForLocale(locale);
  const authState = await createLabelsAuthState(browser, locale);

  for (const theme of themes) {
    const suffix = `${locale}-${theme}`;
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE,
      colorScheme: theme,
      locale: locale === 'de' ? 'de-DE' : 'en-US',
      timezoneId: locale === 'de' ? 'Europe/Berlin' : 'America/New_York',
      storageState: authState,
    });
    const page = await context.newPage();
    await page.addInitScript(localeInitScript(locale, theme === 'light' ? 'light' : undefined));

    await page.goto(`${webUrl}/documents`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForSelector('.library-layout, .page', { timeout: 30_000 });

    if (theme === 'dark') {
      await applyThemeViaAccountMenu(page, locale, 'dark');
      await assertDarkBodyBackground(page);
    }

    await page.goto(`${webUrl}/structure/labels`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.waitForSelector('.labels-todo-panel, .labels-vocabulary-card, .page', {
      timeout: 60_000,
    });
    await page.waitForTimeout(1500);

    const pageText = await page.locator('.page').first().innerText();
    if (pageText.includes('Neue Label-Gruppe')) {
      throw new Error('Labels page still shows placeholder "Neue Label-Gruppe"');
    }

    await assertLabelsSeedAssignments(page, locale);
    await applyMarketingC1Theme(page, theme);
    await assertMarketingAccentNotBlue(page, `labels-${suffix}`);

    await screenshotLabelsPage(page, join(sitePublic, `labels-${suffix}.png`));
    await context.close();
    console.log('Captured labels', suffix);
  }
  await browser.close();
}
