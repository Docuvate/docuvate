#!/usr/bin/env node
/**
 * Capture filesystem screenshots from Docker web (5173). Requires AUTH_COOKIE from seed script.
 */
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = process.env.SCREENSHOT_DIR ?? '/opt/cursor/artifacts/screenshots';
const BASE = process.env.WEB_BASE ?? 'http://127.0.0.1:5173';
const EXPECT_SHA = process.env.VITE_BUILD_SHA ?? process.env.EXPECT_BUILD_SHA;

async function addSession(context) {
  const raw = process.env.AUTH_COOKIE;
  if (!raw) throw new Error('Set AUTH_COOKIE from seed-dateisystem-screenshots.mjs');
  const value = raw.includes('=') ? raw.split('=').slice(1).join('=') : raw;
  await context.addCookies([
    {
      name: 'better-auth.session_token',
      value: decodeURIComponent(value),
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function assertBuildSha(page) {
  if (!EXPECT_SHA) return;
  const sha = await page.evaluate(() => window.__DOCUVATE_BUILD_SHA__ ?? '');
  if (sha !== EXPECT_SHA) {
    throw new Error(`Stale web build: window.__DOCUVATE_BUILD_SHA__=${sha} expected ${EXPECT_SHA}`);
  }
}

/** Content column should fill the shell; card/header/queue share the same right inset as body padding. */
async function assertFilesystemContentWidth(page) {
  const result = await page.evaluate(() => {
    const pane = document.querySelector('.dateisystem-content-pane');
    const body = document.querySelector('.dateisystem-content-body');
    const header = document.querySelector('.dateisystem-content-header');
    const card = document.querySelector(
      '.dateisystem-content-body .library-main-card-filesystem, .dateisystem-content-body .card'
    );
    const queue = document.querySelector('.dateisystem-upload-queue');
    if (!pane || !body) {
      return { ok: false, reason: 'missing-pane-or-body' };
    }
    const paneRect = pane.getBoundingClientRect();
    const bodyPadR = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
    const insetRight = paneRect.right - bodyPadR;
    const samples = [
      ['header', header, paneRect.right],
      ['card', card, insetRight],
      ['queue', queue, insetRight],
    ].filter(([, el]) => el);
    let maxDiff = 0;
    const diffs = {};
    for (const [name, el, expectedRight] of samples) {
      const right = el.getBoundingClientRect().right;
      const diff = Math.abs(right - expectedRight);
      diffs[name] = diff;
      maxDiff = Math.max(maxDiff, diff);
    }
    const paneVsShell = document.querySelector('.dateisystem-shell');
    let shellGap = 0;
    if (paneVsShell) {
      shellGap = paneVsShell.getBoundingClientRect().right - paneRect.right;
    }
    return { ok: maxDiff <= 2 && shellGap <= 2, maxDiff, shellGap, diffs, insetRight };
  });
  if (!result.ok) {
    throw new Error(`Filesystem content width misaligned: ${JSON.stringify(result)}`);
  }
}

/** List search in filesystem card: wide enough for full placeholder at 1440. */
async function assertFilesystemLibrarySearchField(page, minWidth = 360) {
  const result = await page.evaluate((minW) => {
    const input = document.querySelector(
      '.library-main-card-filesystem .library-list-search input, .library-main-card-filesystem .library-list-search .input'
    );
    if (!input) {
      return { ok: false, reason: 'missing-search-input' };
    }
    const rect = input.getBoundingClientRect();
    const style = getComputedStyle(input);
    const placeholder = input.getAttribute('placeholder') ?? '';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { ok: rect.width >= minW, width: rect.width, minW };
    }
    ctx.font = style.font;
    const placeholderWidth = ctx.measureText(placeholder).width;
    const padX =
      (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0);
    const placeholderFits = rect.width + 0.5 >= placeholderWidth + padX;
    const wideEnough = rect.width >= minW;
    const noScrollClip = input.scrollWidth <= input.clientWidth + 1;
    return {
      ok: wideEnough && placeholderFits && noScrollClip,
      width: rect.width,
      placeholderWidth,
      padX,
      scrollWidth: input.scrollWidth,
      clientWidth: input.clientWidth,
      minW,
    };
  }, minWidth);
  if (!result.ok) {
    throw new Error(`Filesystem library search field too narrow: ${JSON.stringify(result)}`);
  }
}

/** Header only — table responsiveness is handled in #80. */
async function assertFilesystemHeaderLayout(page) {
  const overlap = await page.evaluate(() => {
    const heading = document.querySelector('.dateisystem-content-heading');
    const actions = document.querySelector('.dateisystem-content-actions');
    if (!heading || !actions) return false;
    const h = heading.getBoundingClientRect();
    const a = actions.getBoundingClientRect();
    const stacked = h.bottom <= a.top + 2;
    if (stacked) return false;
    return h.left < a.right && a.left < h.right && h.top < a.bottom && a.top < h.bottom;
  });
  if (overlap) {
    throw new Error('Header overlap: breadcrumb/title intersects action buttons');
  }
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('wrote', file);
}

async function waitForAppReady(page) {
  await page.getByText(/Session wird geladen|Loading session/i).waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
  await page.locator('.app-boot-loading').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
  await page.locator('.dateisystem-shell').waitFor({ state: 'visible', timeout: 45_000 });
}

async function waitForDocumentsLoaded(page) {
  await page.locator('.library-documents-panel[aria-busy="true"]').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
  await page.waitForFunction(
    () => {
      const panel = document.querySelector('.library-documents-panel');
      return !panel || panel.getAttribute('aria-busy') !== 'true';
    },
    { timeout: 45_000 }
  );
}

async function waitForDocumentTable(page) {
  await waitForDocumentsLoaded(page);
  await page.locator('.library-table tbody tr').first().waitFor({ state: 'visible', timeout: 45_000 });
}

/** Wait until seeded rows show extraction complete (no duplicate-review badges). */
async function waitForDocumentsExtractionReady(page) {
  await waitForDocumentTable(page);
  await page.waitForFunction(
    () => {
      const rows = document.querySelectorAll('.library-table tbody tr');
      if (rows.length === 0) return false;
      for (const row of rows) {
        if (row.querySelector('.dup-badge')) return false;
        const badge = row.querySelector('.badge');
        if (badge && !badge.classList.contains('badge-ready')) return false;
      }
      return true;
    },
    { timeout: 120_000 }
  );
}

async function openEhwMappe(page) {
  await page.goto(`${BASE}/filesystem`, { waitUntil: 'domcontentloaded' });
  await assertBuildSha(page);
  await waitForAppReady(page);
  await page.locator('a.sidebar-mappe-link.dateisystem-tree-link', { hasText: 'EHW+' }).click();
  await page.waitForURL(/\/filesystem\/containers\//, { timeout: 20_000 });
  await waitForDocumentsExtractionReady(page);
}

async function openEmptyInternet(page) {
  await page.goto(`${BASE}/filesystem`, { waitUntil: 'domcontentloaded' });
  await assertBuildSha(page);
  await waitForAppReady(page);
  await page.locator('a.dateisystem-tree-link', { hasText: /^Haus$/ }).click();
  await page.waitForURL(/\/filesystem\/folders\//);
  await page.locator('a.dateisystem-tree-link', { hasText: 'Internet' }).click();
  await page.waitForURL(/\/filesystem\/folders\//);
  await page.locator('.dateisystem-folder-dropzone').first().waitFor({ timeout: 15_000 });
  await waitForDocumentsLoaded(page);
}

function refreshSeedAuth() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const seedOut = execSync('node scripts/seed-dateisystem-screenshots.mjs', {
        cwd: '/workspace',
        timeout: 180_000,
        env: {
          ...process.env,
          ...(process.env.AUTH_COOKIE ? { COOKIE: process.env.AUTH_COOKIE } : {}),
        },
      }).toString();
      const meta = JSON.parse(seedOut);
      process.env.AUTH_COOKIE = meta.authCookie;
      return;
    } catch (err) {
      delete process.env.COOKIE;
      delete process.env.AUTH_COOKIE;
      if (attempt >= 5) throw err;
      execSync(`sleep ${2 + attempt * 2}`);
    }
  }
}

function widthTag(width) {
  if (width === 1024) return '-1024';
  if (width === 1280) return '-1280';
  return '';
}

async function captureLocale(browser, { locale, lang, colorScheme, suffix, width }) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    locale,
    colorScheme,
  });
  await addSession(context);
  const page = await context.newPage();
  await page.addInitScript(({ lng, theme }) => {
    window.localStorage.setItem('i18nextLng', lng);
    window.localStorage.setItem('docuvate-theme', theme);
  }, { lng: lang, theme: colorScheme === 'dark' ? 'dark' : 'light' });

  const tag = widthTag(width);

  await openEhwMappe(page);
  await assertFilesystemContentWidth(page);
  if (width === 1440) {
    await assertFilesystemLibrarySearchField(page);
  }
  if (width === 1024 || width === 1280) {
    await assertFilesystemHeaderLayout(page);
  }
  await shot(page, `filesystem-${suffix}${tag}-ehw-uploads.png`);

  if (suffix === 'de-light' && width === 1440) {
    await page.goto(`${BASE}/filesystem`, { waitUntil: 'domcontentloaded' });
    await assertBuildSha(page);
    await waitForAppReady(page);
    await shot(page, `filesystem-${suffix}-overview.png`);

    await openEmptyInternet(page);
    await assertFilesystemContentWidth(page);
    await shot(page, `filesystem-${suffix}-empty-folder.png`);

    const dropzone = page.locator('.dateisystem-folder-dropzone').first();
    await dropzone.evaluate((el) => el.classList.add('is-drag-over'));
    await shot(page, `filesystem-${suffix}-drag-over.png`);

    refreshSeedAuth();
    await openEhwMappe(page);
    await page.waitForFunction(() => {
      const rows = [...document.querySelectorAll('.dateisystem-tree-row')];
      const haus = rows.find((row) => {
        const link = row.querySelector('.dateisystem-tree-link');
        return link?.textContent?.trim().startsWith('Haus');
      });
      if (!haus) return true;
      const countEl = haus.querySelector('.dateisystem-tree-count');
      return countEl?.textContent?.trim() === '0';
    });
    let delayed = 0;
    await page.route('**/v1/documents?**', async (route) => {
      if (route.request().method() === 'POST') {
        delayed += 1;
        if (delayed === 2) {
          await new Promise((r) => setTimeout(r, 4000));
        }
      }
      await route.continue();
    });
    await page.locator('input[type="file"]').first().setInputFiles([
      '/workspace/experiments/fixtures/upload-fortschritt-fertig.pdf',
      '/workspace/experiments/fixtures/upload-fortschritt-laufend.pdf',
    ]);
    await page.locator('.upload-queue-item.upload-uploading, .upload-queue-item.upload-pending').first().waitFor({
      timeout: 20_000,
    });
    await page.locator('.upload-queue-item.upload-done').first().waitFor({ timeout: 20_000 }).catch(() => {});
    await assertFilesystemLibrarySearchField(page);
    await page.waitForFunction(() => {
      const row = document.querySelector('.dateisystem-tree-row.is-selected');
      if (!row) return false;
      const count = row.querySelector('.dateisystem-tree-count');
      if (!count?.textContent?.trim()) return false;
      const countRect = count.getBoundingClientRect();
      const actions = row.querySelector('.dateisystem-tree-actions');
      if (!actions) return false;
      const actionsRect = actions.getBoundingClientRect();
      return countRect.right <= actionsRect.left + 1 && countRect.width > 0;
    });
    await shot(page, `filesystem-${suffix}-upload-progress.png`);
    await page.unroute('**/v1/documents?**');
    refreshSeedAuth();
  }

  await context.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  for (const spec of [
    { locale: 'de-DE', lang: 'de', colorScheme: 'light', suffix: 'de-light' },
    { locale: 'de-DE', lang: 'de', colorScheme: 'dark', suffix: 'de-dark' },
    { locale: 'en-US', lang: 'en', colorScheme: 'light', suffix: 'en-light' },
  ]) {
    for (const width of [1440, 1280, 1024]) {
      refreshSeedAuth();
      await captureLocale(browser, { ...spec, width });
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
