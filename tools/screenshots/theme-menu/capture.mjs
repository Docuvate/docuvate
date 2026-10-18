#!/usr/bin/env node
/**
 * Theme menu screenshots (Hell/Dunkel/System + Sprache) for PR review.
 */
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
import {
  THEME_MENU_EMAIL,
  THEME_MENU_NAME,
  THEME_MENU_PASSWORD,
  seedThemeMenuLibrary,
} from './seed.mjs';

const OUT = process.env.SCREENSHOT_DIR
  ? path.resolve(process.env.SCREENSHOT_DIR)
  : path.join(REPO_ROOT, 'artifacts/screenshots/theme-menu');
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const DOCUMENTS = `${BASE}/documents`;
const AUTH = `${BASE}/api/auth`;
const API = `${BASE}/api/v1`;
const ORIGIN = new URL(BASE).origin;
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

const authHeaders = { Origin: ORIGIN, Referer: `${ORIGIN}/` };

await mkdir(OUT, { recursive: true });
await seedThemeMenuLibrary();

async function apiLogin(context) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let res = await context.request.post(`${AUTH}/sign-in/email`, {
      headers: authHeaders,
      data: { email: THEME_MENU_EMAIL, password: THEME_MENU_PASSWORD },
    });
    if (res.status() === 429) {
      await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
      continue;
    }
    if (!res.ok()) {
      await context.request.post(`${AUTH}/sign-up/email`, {
        headers: authHeaders,
        data: { email: THEME_MENU_EMAIL, password: THEME_MENU_PASSWORD, name: THEME_MENU_NAME },
      });
      res = await context.request.post(`${AUTH}/sign-in/email`, {
        headers: authHeaders,
        data: { email: THEME_MENU_EMAIL, password: THEME_MENU_PASSWORD },
      });
    }
    if (res.ok()) return;
    if (res.status() === 429) continue;
    throw new Error(`login failed ${res.status()}`);
  }
  throw new Error('login rate limited');
}

async function patchSettings(context, body) {
  const res = await context.request.patch(`${API}/settings`, {
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    data: body,
  });
  if (!res.ok()) throw new Error(`PATCH settings ${res.status()}`);
}

async function gotoDocuments(page, locale, themePreference) {
  await page.goto(DOCUMENTS, { waitUntil: 'networkidle' });
  await page.evaluate(
    ({ localeTag, pref }) => {
      if (localeTag) localStorage.setItem('docuvate.locale', localeTag);
      localStorage.setItem('docuvate-theme-preference', pref);
      const resolved =
        pref === 'light' || pref === 'dark'
          ? pref
          : window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
      localStorage.setItem('docuvate-theme', resolved);
      document.documentElement.setAttribute('data-docuvate-theme', resolved);
    },
    { localeTag: locale, pref: themePreference }
  );
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.library-doc-table-card, .library-documents-panel').first().waitFor({
    timeout: 30_000,
  });
  await page
    .getByText(/Rechnung Stadtwerke|Versicherung Hausrat|Kontoauszug Februar|Mietvertrag Wohnung/)
    .first()
    .waitFor({ timeout: 15_000 });
}

async function openMenu(page) {
  await page.locator('.user-account-menu-trigger').click();
  await page.locator('.user-account-menu-panel').waitFor({ state: 'visible' });
  await page.locator('.user-account-menu-theme .segmented-control').waitFor({
    state: 'visible',
    timeout: 15_000,
  });
}

async function shot(page, file) {
  const filePath = path.join(OUT, file);
  await page.screenshot({ path: filePath, fullPage: false });
  const rel = path.relative(REPO_ROOT, filePath);
  return { file, path: rel.startsWith('..') ? filePath : rel };
}

const manifest = {
  capturedGitHead: SHA,
  persona: { name: THEME_MENU_NAME, email: THEME_MENU_EMAIL },
  capturedAt: new Date().toISOString(),
  files: [],
};

const browser = await chromium.launch();

const desktopCtx = await browser.newContext({
  locale: 'de-DE',
  viewport: { width: 1280, height: 800 },
});
await apiLogin(desktopCtx);
const desktopPage = await desktopCtx.newPage();

for (const theme of ['light', 'dark']) {
  await patchSettings(desktopCtx, { themePreference: theme, locale: 'de' });
  await gotoDocuments(desktopPage, 'de', theme);
  manifest.files.push(await shot(desktopPage, `de-${theme}-1280-documents.png`));
  await openMenu(desktopPage);
  manifest.files.push(await shot(desktopPage, `de-${theme}-1280-avatar-menu.png`));
  await desktopPage.keyboard.press('Escape');
}

const mobileCtx = await browser.newContext({
  locale: 'de-DE',
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await apiLogin(mobileCtx);
const mobilePage = await mobileCtx.newPage();

for (const theme of ['light', 'dark']) {
  await patchSettings(mobileCtx, { themePreference: theme, locale: 'de' });
  await gotoDocuments(mobilePage, 'de', theme);
  manifest.files.push(await shot(mobilePage, `de-${theme}-390-documents.png`));
  await openMenu(mobilePage);
  manifest.files.push(await shot(mobilePage, `de-${theme}-390-avatar-menu.png`));
  await mobilePage.keyboard.press('Escape');
}

await browser.close();
await writeFile(path.join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('theme-menu screenshots complete', OUT, 'sha', SHA);
