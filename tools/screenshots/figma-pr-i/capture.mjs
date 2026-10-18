#!/usr/bin/env node
/**
 * PR-I screenshots: labels, recognized fields, documents library (1440 / 1024 / 390, light + dark).
 * Run with dev stack: WEB_BASE=http://localhost:5173 node tools/screenshots/figma-pr-i/capture.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const ORIGIN = new URL(BASE).origin;
const OUT =
  process.env.SCREENSHOT_DIR ??
  path.join(process.cwd(), 'docs/screenshots/pr-i');
const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SCREENSHOT_USER_PASSWORD ?? 'LabelsScreenshot1!';

const WIDTHS = [1440, 1024, 390];
const THEMES = ['light', 'dark'];

function readDocumentDetailPath() {
  const manifestPath = path.join(OUT, 'seed-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Missing ${manifestPath}. Run node scripts/seed-labels-screenshots.mjs first.`
    );
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest.documentDetailId) {
    throw new Error(`seed-manifest.json missing documentDetailId`);
  }
  return `/documents/${manifest.documentDetailId}`;
}

function buildRoutes(documentDetailPath) {
  return [
    { slug: 'labels', path: '/structure/labels', wait: '[data-ux="page-title"]' },
    { slug: 'fields', path: '/structure/recognized-fields', wait: '[data-ux="page-title"]' },
    {
      slug: 'documents',
      path: '/documents',
      wait: '.library-grouped-label-card',
    },
    {
      slug: 'saved-views',
      path: '/documents/views',
      waitFn: async (page) => {
        const desktop = page.locator('.saved-views-description-text').first();
        const mobile = page.locator('.saved-views-manage-list-desc').first();
        await page.waitForSelector('[data-ux="page-title"]', { timeout: 60_000 });
        if (await desktop.isVisible().catch(() => false)) {
          return;
        }
        await mobile.waitFor({ state: 'visible', timeout: 60_000 });
        const text = (await mobile.innerText()).trim();
        if (!text) {
          throw new Error('saved view list description empty on narrow viewport');
        }
      },
    },
    {
      slug: 'document-detail',
      path: `${documentDetailPath}?tab=details`,
      wait: '.document-field-value-cards #document-metadata-file-summary',
      waitFn: async (page) => {
        await page.waitForSelector('.document-field-value-cards', { timeout: 60_000 });
        await page.waitForSelector('#document-metadata-file-summary', { timeout: 60_000 });
        const summary = await page.locator('#document-metadata-file-summary').innerText();
        if (!/\d/.test(summary)) {
          throw new Error('document metadata file summary missing numeric file size');
        }
        await page.waitForFunction(
          () => document.querySelectorAll('dialog[open]').length === 0,
          null,
          { timeout: 15_000 }
        ).catch(async () => {
          const openLeave = page.locator('dialog[open]').filter({ hasText: 'Leave this page' });
          if ((await openLeave.count()) > 0) {
            await page.getByRole('button', { name: /^Stay$/i }).click();
          }
        });
        await page.waitForFunction(
          () => document.querySelectorAll('dialog[open]').length === 0,
          null,
          { timeout: 5_000 }
        );
      },
    },
  ];
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function login(page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    try {
      await page.waitForFunction(
        () => window.location.pathname.includes('/documents') || window.location.pathname === '/',
        null,
        { timeout: 30_000 }
      );
      return;
    } catch {
      await page.waitForTimeout(2000 * (attempt + 1));
    }
  }
  throw new Error('login failed after retries');
}

async function setTheme(page, theme) {
  const preference = theme === 'dark' ? 'dark' : 'light';
  await page.emulateMedia({ colorScheme: preference });
  await page.evaluate((pref) => {
    localStorage.setItem('docuvate-theme-preference', pref);
    localStorage.setItem('docuvate-theme', pref);
    document.documentElement.setAttribute('data-docuvate-theme', pref);
  }, preference);
}

async function capture(page, file) {
  ensureDir(path.dirname(file));
  await page.screenshot({ path: file, fullPage: true });
}

async function waitForRoute(page, route) {
  if (route.waitFn) {
    await route.waitFn(page);
    return;
  }
  await page.waitForSelector(route.wait, { timeout: 60_000 });
}

async function main() {
  ensureDir(OUT);
  const routes = buildRoutes(readDocumentDetailPath());
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const loginPage = await context.newPage();
  await login(loginPage);
  await loginPage.close();
  const state = await context.storageState();

  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      for (const route of routes) {
        const preference = theme === 'dark' ? 'dark' : 'light';
        const page = await browser.newPage({
          storageState: state,
          viewport: { width, height: 900 },
          colorScheme: preference,
        });
        await page.addInitScript((pref) => {
          localStorage.setItem('docuvate-theme-preference', pref);
          localStorage.setItem('docuvate-theme', pref);
          document.documentElement.setAttribute('data-docuvate-theme', pref);
        }, preference);
        await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' });
        await setTheme(page, theme);
        await waitForRoute(page, route);
        await capture(
          page,
          path.join(OUT, `${route.slug}-${width}-${theme}.png`)
        );
        await page.close();
      }
    }
  }

  await browser.close();
  process.stdout.write(`Wrote PR-I screenshots to ${OUT}\n`);
}

main().catch((err) => {
  process.stderr.write(`${String(err)}\n`);
  process.exit(1);
});
