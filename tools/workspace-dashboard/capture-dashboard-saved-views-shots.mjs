#!/usr/bin/env node
/**
 * Workspace saved-views proof screenshots (de, light/dark, 1280/390). Requires compose + seed.
 */
import { chromium, devices, request } from 'playwright';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const defaultOut = path.join(repoRoot, 'tmp/saved-views-dashboard-screenshots');
const OUT = process.env.SCREENSHOT_OUT_DIR ?? defaultOut;
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const THEME_KEY = 'docuvate-theme-preference';
const LOCALE_KEY = 'docuvate.locale';
const THEME_ATTR = 'data-docuvate-theme';
const email = process.env.SEED_EMAIL ?? 'workspace-screenshots@fixture.docuvate.test';
const password = process.env.SEED_PASSWORD ?? 'WorkspaceScreenshot1!';
const WIDTHS = [1280, 390];
const THEMES = ['light', 'dark'];

const SHOT_SUFFIXES = [
  'dashboard-view',
  'dashboard-customize',
  'drawer-saved-views',
  'documents-active-view',
  'documents-active-view-drawer-open',
  'save-view-dialog',
  'saved-toast',
  'manage-row-menu',
  'manage-page',
];

let authStatePath;
let authTmpDir;

async function setLocale(page) {
  await page.evaluate((localeKey) => {
    localStorage.setItem(localeKey, 'de');
    localStorage.setItem('i18nextLng', 'de');
    document.documentElement.lang = 'de';
  }, LOCALE_KEY);
}

async function pinTheme(page, mode) {
  await page.evaluate(
    ({ prefKey, attr, mode: m }) => {
      localStorage.setItem(prefKey, m);
      localStorage.setItem('docuvate-theme', m);
      document.documentElement.setAttribute(attr, m);
    },
    { prefKey: THEME_KEY, attr: THEME_ATTR, mode }
  );
}

async function assertDarkTheme(page) {
  const theme = await page.evaluate((attr) => document.documentElement.getAttribute(attr), THEME_ATTR);
  if (theme !== 'dark') {
    throw new Error(`Expected data-docuvate-theme=dark, got ${theme}`);
  }
}

async function assertNoRawI18n(page) {
  const text = await page.locator('body').innerText();
  const match = text.match(/\b(?:savedViews|dashboard|auth|nav|library|common)\.[a-zA-Z][\w.]*/);
  if (match) {
    throw new Error(`Possible raw i18n key visible in UI: ${match[0]}`);
  }
}

async function expectActiveSavedViewCount(page, expected) {
  const count = await page.locator('.sidebar-saved-view-link.active').count();
  if (count !== expected) {
    throw new Error(`Expected ${expected} active saved-view sidebar link(s), got ${count}`);
  }
  const ariaCount = await page.locator('.sidebar-saved-view-link[aria-current="page"]').count();
  if (ariaCount !== expected) {
    throw new Error(
      `Expected ${expected} saved-view link(s) with aria-current=page, got ${ariaCount}`
    );
  }
}

async function dismissToasts(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.toast-region .toast').forEach((node) => node.remove());
  });
}

async function shot(page, name, options = {}) {
  if (!options.keepToasts) {
    await dismissToasts(page);
  }
  await assertNoRawI18n(page);
  const file = name.endsWith('.png') ? name : `${name}.png`;
  const full = path.join(OUT, file);
  await page.screenshot({ path: full, fullPage: true });
  return full;
}

async function loginOnce() {
  authTmpDir = await mkdtemp(path.join(os.tmpdir(), 'docuvate-screenshot-auth-'));
  authStatePath = path.join(authTmpDir, 'storage-state.json');
  const req = await request.newContext({ baseURL: BASE });
  const res = await req.post('/api/auth/sign-in/email', {
    data: { email, password },
    headers: { 'content-type': 'application/json', origin: BASE },
  });
  if (!res.ok()) {
    throw new Error(`sign-in failed ${res.status()}: ${await res.text()}`);
  }
  await req.storageState({ path: authStatePath });
  await req.dispose();
}

async function newContext(browser, width, theme) {
  const viewport =
    width === 390
      ? { ...devices['iPhone 12'], viewport: { width: 390, height: 844 } }
      : { viewport: { width, height: 900 } };
  const ctx = await browser.newContext({
    ...viewport,
    colorScheme: theme,
    locale: 'de-DE',
    storageState: authStatePath,
  });
  await ctx.addInitScript(
    ({ themeMode, localeKey }) => {
      localStorage.setItem('docuvate-theme-preference', themeMode);
      localStorage.setItem('docuvate-theme', themeMode);
      localStorage.setItem(localeKey, 'de');
      localStorage.setItem('i18nextLng', 'de');
    },
    { themeMode: theme, localeKey: LOCALE_KEY }
  );
  return ctx;
}

async function waitForGermanUi(page) {
  await page.waitForFunction(() => {
    const text = document.body?.innerText ?? '';
    if (/\b(?:savedViews|common|dashboard|nav)\.[a-zA-Z][\w.]*\b/.test(text)) {
      return false;
    }
    return document.documentElement.lang === 'de' || text.includes('Dokumente');
  }, { timeout: 60_000 });
}

async function gotoApp(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => undefined);
  await setLocale(page);
  await waitForGermanUi(page);
}

async function openMobileNav(page, width) {
  if (width !== 390) return;
  const shell = page.locator('.app-shell');
  const open = await shell.evaluate((el) => el.classList.contains('app-shell-mobile-nav-open'));
  if (open) return;
  const trigger = page.getByRole('button', { name: /Hauptnavigation/i });
  await trigger.waitFor({ state: 'visible', timeout: 15_000 });
  await trigger.click();
  await shell.evaluate((el) => {
    if (!el.classList.contains('app-shell-mobile-nav-open')) {
      throw new Error('Mobile nav did not open');
    }
  });
}

async function closeMobileNav(page, width) {
  if (width !== 390) return;
  const shell = page.locator('.app-shell');
  const open = await shell.evaluate((el) => el.classList.contains('app-shell-mobile-nav-open'));
  if (!open) return;
  await page.keyboard.press('Escape');
  await shell.evaluate((el) => {
    if (el.classList.contains('app-shell-mobile-nav-open')) {
      throw new Error('Mobile nav did not close');
    }
  });
}

async function waitForAuthSession(page) {
  await page.waitForFunction(async () => {
    const response = await fetch('/api/auth/get-session', { credentials: 'include' });
    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data?.user?.id);
  }, { timeout: 60_000 });
}

async function closeDialogIfOpen(page) {
  const dialog = page.locator('dialog[open]');
  if (await dialog.count()) {
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 5_000 });
  }
}

async function clickAndWait(locator, options = {}) {
  await locator.scrollIntoViewIfNeeded();
  await locator.waitFor({ state: 'visible', timeout: 30_000 });
  await locator.click({ ...options, timeout: 30_000 });
}

async function captureAll(browser, width, theme) {
  const slug = `de-${theme}-${width}`;
  const ctx = await newContext(browser, width, theme);
  const page = await ctx.newPage();

  await gotoApp(page, `${BASE}/`);
  await pinTheme(page, theme);
  if (theme === 'dark') await assertDarkTheme(page);
  await page.waitForSelector('.dashboard-page', { timeout: 60_000 });
  await page.locator('.dashboard-page [aria-busy="true"]').waitFor({ state: 'detached', timeout: 60_000 }).catch(() => undefined);
  await shot(page, `dashboard-view-${slug}`);

  await clickAndWait(page.getByRole('button', { name: /customize|anpassen/i }));
  await page.locator('.dashboard-add-panel').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('.dashboard-widget-edit-actions').first().waitFor({ state: 'visible', timeout: 30_000 });
  const editActionCount = await page.locator('.dashboard-widget-edit-actions').count();
  if (editActionCount < 2) {
    throw new Error(`Expected at least 2 dashboard widgets in customize mode, got ${editActionCount}`);
  }
  await shot(page, `dashboard-customize-${slug}`);
  await clickAndWait(page.getByRole('button', { name: /^fertig$/i }));
  await page.locator('.toast-region .toast--success').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  await dismissToasts(page);

  await gotoApp(page, `${BASE}/documents`);
  await pinTheme(page, theme);
  if (width === 390) {
    await openMobileNav(page, width);
    const savedViewsRail = page.locator('.sidebar-saved-views');
    await savedViewsRail.waitFor({ state: 'visible', timeout: 60_000 });
    await savedViewsRail.scrollIntoViewIfNeeded();
    await expectActiveSavedViewCount(page, 0);
    await shot(page, `drawer-saved-views-${slug}`);
    await closeMobileNav(page, width);
  }

  const pinnedActive = page.locator('.sidebar-saved-view-link').first();
  await pinnedActive.waitFor({ state: 'visible', timeout: 30_000 });
  const href = await pinnedActive.getAttribute('href');
  if (!href?.includes('view=')) {
    throw new Error('Expected pinned saved view link with view= query');
  }
  await gotoApp(page, `${BASE}${href.startsWith('/') ? href : `/${href}`}`);
  await pinTheme(page, theme);
  await page.waitForSelector('.library-page', { timeout: 60_000 });
  const activeSavedLinks = page.locator('.sidebar-saved-view-link.active');
  await expectActiveSavedViewCount(page, 1);
  const activeSavedLink = activeSavedLinks.first();
  await activeSavedLink.waitFor({ state: 'visible', timeout: 30_000 });
  if (width === 390) {
    await closeMobileNav(page, width);
  }
  await shot(page, `documents-active-view-${slug}`);
  if (width === 390) {
    await openMobileNav(page, width);
    await activeSavedLink.scrollIntoViewIfNeeded();
    await shot(page, `documents-active-view-drawer-open-${slug}`);
    await closeMobileNav(page, width);
  }

  const updateBtn = page.getByRole('button', { name: /aktuellen filtern aktualisieren/i });
  await updateBtn.waitFor({ state: 'visible', timeout: 30_000 });
  const updateSaved = page.waitForResponse(
    (res) =>
      res.url().includes('saved-views') &&
      res.request().method() === 'PATCH' &&
      res.ok(),
    { timeout: 30_000 }
  );
  const toastVisible = page.locator('.toast-region .toast--success').waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  await clickAndWait(updateBtn);
  await Promise.all([updateSaved, toastVisible]);
  const toastText = await page.locator('.toast-region .toast--success .toast-message').innerText();
  if (!/gespeichert/i.test(toastText) || /\bcommon\./.test(toastText)) {
    throw new Error(`Expected German Gespeichert toast, got: ${toastText}`);
  }
  await page.locator('.toast-region .toast--success').waitFor({ state: 'visible', timeout: 5_000 });
  await shot(page, `saved-toast-${slug}`, { keepToasts: true });
  await dismissToasts(page);

  await gotoApp(page, `${BASE}/documents`);
  await closeDialogIfOpen(page);
  await page.waitForSelector('.library-page', { timeout: 60_000 });
  const saveBtn = page.getByRole('button', { name: /save view|ansicht speichern/i });
  await clickAndWait(saveBtn);
  await page.waitForSelector('dialog[open] .save-view-dialog-form', { timeout: 30_000 });
  await shot(page, `save-view-dialog-${slug}`);
  await closeDialogIfOpen(page);

  const viewsLoaded = page.waitForResponse(
    (res) => res.url().includes('saved-views') && res.request().method() === 'GET' && res.ok(),
    { timeout: 60_000 }
  );
  await gotoApp(page, `${BASE}/documents/views`);
  await viewsLoaded;
  await waitForAuthSession(page);
  await pinTheme(page, theme);
  await page.waitForSelector('.saved-views-page', { timeout: 60_000 });
  if (width === 390) {
    await page.waitForSelector('.saved-views-manage-list', { state: 'visible', timeout: 60_000 });
    await page
      .locator('.saved-views-manage-list .saved-views-manage-list-item')
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 });
  } else {
    await page.waitForSelector('.saved-views-manage-table tbody tr', {
      state: 'visible',
      timeout: 60_000,
    });
  }

  await waitForGermanUi(page);

  const menuBtn = page
    .locator(width === 390 ? '.saved-views-manage-list' : '.saved-views-manage-table')
    .getByRole('button', { name: /Aktionen für/i })
    .first();
  await clickAndWait(menuBtn);
  await page.locator('[role="menu"]').waitFor({ state: 'visible', timeout: 20_000 });
  await shot(page, `manage-row-menu-${slug}`);
  await page.keyboard.press('Escape');
  await page.locator('[role="menu"]').waitFor({ state: 'hidden', timeout: 10_000 });

  await gotoApp(page, `${BASE}/documents/views`);
  await pinTheme(page, theme);
  await page.waitForSelector('.saved-views-page', { timeout: 60_000 });
  if (width === 390) {
    await page.waitForSelector('.saved-views-manage-list', { state: 'visible', timeout: 30_000 });
  }
  await shot(page, `manage-page-${slug}`);

  await ctx.close();
}

function gitHeadSha() {
  try {
    return execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function expectedFileNames() {
  const names = [];
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      const slug = `de-${theme}-${width}`;
      for (const stem of SHOT_SUFFIXES) {
        if (
          (stem === 'documents-active-view-drawer-open' || stem === 'drawer-saved-views') &&
          width !== 390
        ) {
          continue;
        }
        names.push(`${stem}-${slug}.png`);
      }
    }
  }
  return names.sort();
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

try {
  await loginOnce();
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      await captureAll(browser, width, theme);
    }
  }
} finally {
  await browser.close();
  if (authTmpDir) {
    await rm(authTmpDir, { recursive: true, force: true });
  }
}

const expected = expectedFileNames();
const onDisk = (await readdir(OUT)).filter((n) => n.endsWith('.png')).sort();
const missing = expected.filter((n) => !onDisk.includes(n));
const extra = onDisk.filter((n) => !expected.includes(n));
if (missing.length > 0 || extra.length > 0) {
  throw new Error(
    `Screenshot set mismatch. missing=${JSON.stringify(missing)} extra=${JSON.stringify(extra)}`
  );
}

const hashes = {};
for (const name of onDisk) {
  const buf = await readFile(path.join(OUT, name));
  hashes[name] = createHash('md5').update(buf).digest('hex');
}
const dupes = Object.entries(
  onDisk.reduce((acc, name) => {
    const h = hashes[name];
    acc[h] = acc[h] ?? [];
    acc[h].push(name);
    return acc;
  }, {})
).filter(([, names]) => names.length > 1);
if (dupes.length > 0) {
  throw new Error(`Duplicate screenshot content: ${JSON.stringify(dupes)}`);
}

const manifest = {
  headSha: gitHeadSha(),
  capturedAt: new Date().toISOString(),
  files: onDisk.map((name) => ({ name, md5: hashes[name] })),
};
await writeFile(path.join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${onDisk.length} screenshots to ${OUT} (head ${manifest.headSha})`);
