#!/usr/bin/env node
/**
 * Library / shell polish screenshots for PR review.
 * Run: node tools/screenshots/library/capture-library-polish.mjs
 */
import { chromium } from 'playwright';
import { mkdir, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const API = `${BASE}/api/v1`;
const ORIGIN = new URL(BASE).origin;
const OUT = process.env.SCREENSHOT_DIR ?? '/cursor/stores/self/library-polish';
const authHeaders = { Origin: ORIGIN, Referer: `${ORIGIN}/` };
const EMAIL =
  process.env.SCREENSHOT_USER_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD =
  process.env.SCREENSHOT_USER_PASSWORD ?? 'LabelsScreenshot1!';
const NARROW_MAX_PX = 768;

async function login(page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    try {
      await page.waitForFunction(() => window.location.pathname.includes('/documents'), null, {
        timeout: 30_000,
      });
      return;
    } catch {
      await page.waitForTimeout(2000 * (attempt + 1));
    }
  }
  throw new Error('login failed after retries');
}

async function patchSettings(context, body) {
  const res = await context.request.patch(`${API}/settings`, {
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    data: body,
  });
  if (!res.ok()) {
    throw new Error(`PATCH settings ${res.status()}: ${(await res.text()).slice(0, 200)}`);
  }
}

async function assertResolvedTheme(page, expected) {
  const actual = await page.evaluate(() =>
    document.documentElement.getAttribute('data-docuvate-theme')
  );
  if (actual !== expected) {
    throw new Error(`Expected data-docuvate-theme="${expected}", got "${actual}"`);
  }
}

async function assertNarrowLibraryLayout(page) {
  const narrow = await page.evaluate(
    (maxPx) => window.matchMedia(`(max-width: ${maxPx}px)`).matches,
    NARROW_MAX_PX
  );
  if (!narrow) {
    throw new Error(`Expected viewport ≤${NARROW_MAX_PX}px`);
  }
  await page.waitForSelector('[data-testid="library-doc-stack-list"]', { timeout: 60_000 });
  if ((await page.locator('.library-table thead').count()) > 0) {
    throw new Error('Library table header visible on narrow viewport');
  }
  await page.waitForSelector('.library-list-search--compact', { timeout: 15_000 });
  const paddingLeft = await page.$eval(
    '.library-page .library-main .card.library-doc-table-card',
    (el) => getComputedStyle(el).paddingLeft
  );
  if (paddingLeft !== '0px') {
    throw new Error(`Expected card padding-left 0px, got ${paddingLeft}`);
  }
  await assertCompactSearchInputFits(page);
}

async function assertCompactSearchInputFits(page) {
  const input = page.locator('.library-list-search--compact input[type="text"], .library-list-search--compact .input').first();
  await input.waitFor({ state: 'visible', timeout: 15_000 });
  const metrics = await input.evaluate((el) => ({
    clientWidth: el.clientWidth,
    scrollWidth: el.scrollWidth,
  }));
  if (metrics.clientWidth < 280 && metrics.scrollWidth > metrics.clientWidth) {
    throw new Error(
      `Search input too narrow or clipped (clientWidth=${metrics.clientWidth}, scrollWidth=${metrics.scrollWidth})`
    );
  }
  if (metrics.clientWidth < 280) {
    throw new Error(`Search input clientWidth ${metrics.clientWidth}px < 280px minimum`);
  }
}

async function assertWideLibraryLayout(page) {
  await page.waitForSelector('.library-table-wrap .library-table thead', { timeout: 60_000 });
  if ((await page.locator('[data-testid="library-doc-stack-list"]').count()) > 0) {
    throw new Error('Stack list visible on wide viewport');
  }
}

async function gotoLibrary(page, locale, themePreference, { wide = false } = {}) {
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  const resolved = await page.evaluate(
    ({ localeTag, pref }) => {
      if (localeTag) {
        localStorage.setItem('docuvate.locale', localeTag);
        localStorage.setItem('i18nextLng', localeTag);
      }
      localStorage.setItem('docuvate.library.viewMode', 'klassisch');
      localStorage.setItem('docuvate-theme-preference', pref);
      const resolvedTheme =
        pref === 'light' || pref === 'dark'
          ? pref
          : window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
      localStorage.setItem('docuvate-theme', resolvedTheme);
      document.documentElement.setAttribute('data-docuvate-theme', resolvedTheme);
      return resolvedTheme;
    },
    { localeTag: locale, pref: themePreference }
  );
  await page.reload({ waitUntil: 'networkidle' });
  if (wide) {
    await assertWideLibraryLayout(page);
  } else {
    await assertNarrowLibraryLayout(page);
  }
  return resolved;
}

async function viewportShot(page, fileName, { fullPage = false } = {}) {
  const file = path.join(OUT, fileName);
  await page.screenshot({ path: file, fullPage });
  console.log('wrote', file, fullPage ? '(full page)' : '');
}

async function openMobileNav(page) {
  const menuBtn = page.getByRole('button', { name: /Hauptnavigation|Main navigation/i });
  await menuBtn.click();
  await page.waitForSelector('.app-shell-mobile-nav-open', { timeout: 5000 });
  await page.waitForTimeout(300);
}

async function prepareLibrary(context, page, locale, themePreference, { wide = false } = {}) {
  await patchSettings(context, { locale, themePreference });
  const resolved = await gotoLibrary(page, locale, themePreference, { wide });
  await assertResolvedTheme(page, resolved);
  return resolved;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const file of await readdir(OUT)) {
    if (file.startsWith('debug') && file.endsWith('.png')) {
      await unlink(path.join(OUT, file));
    }
  }

  const browser = await chromium.launch({ headless: true });

  {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 900 }, locale: 'de-DE' });
    const page = await ctx.newPage();
    await login(page);
    await prepareLibrary(ctx, page, 'de', 'light');
    await viewportShot(page, 'library-768-de-light.png', { fullPage: true });
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, locale: 'de-DE' });
    const page = await ctx.newPage();
    await login(page);
    await prepareLibrary(ctx, page, 'de', 'light');
    await viewportShot(page, 'library-430-de-light.png', { fullPage: true });
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE' });
    const page = await ctx.newPage();
    await login(page);
    await prepareLibrary(ctx, page, 'de', 'light');
    await viewportShot(page, 'library-390-de-light.png', { fullPage: true });
    await patchSettings(ctx, { themePreference: 'dark', locale: 'de' });
    await prepareLibrary(ctx, page, 'de', 'dark');
    await assertResolvedTheme(page, 'dark');
    await viewportShot(page, 'library-390-de-dark.png', { fullPage: true });
    await prepareLibrary(ctx, page, 'de', 'light');
    await openMobileNav(page);
    await viewportShot(page, 'library-390-de-light-drawer-open.png', { fullPage: true });
    await ctx.close();
  }

  await browser.close();
}

await main();
