#!/usr/bin/env node
/**
 * PR-I screenshots: labels, recognized fields, documents library (1440 / 1024 / 390, light + dark).
 * Run with dev stack: WEB_BASE=http://localhost:5173 node tools/screenshots/figma-pr-i/capture.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const API = `${BASE.replace(/\/$/, '')}/api/v1`.replace('/api/v1/api/v1', '/api/v1');
const ORIGIN = new URL(BASE).origin;
const OUT =
  process.env.SCREENSHOT_DIR ??
  path.join(process.cwd(), 'docs/screenshots/pr-i');
const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SCREENSHOT_USER_PASSWORD ?? 'LabelsScreenshot1!';

const WIDTHS = [1440, 1024, 390];
const THEMES = ['light', 'dark'];

const ROUTES = [
  { slug: 'labels', path: '/structure/labels', wait: '[data-ux="page-title"]' },
  { slug: 'fields', path: '/structure/recognized-fields', wait: '[data-ux="page-title"]' },
  { slug: 'documents', path: '/documents', wait: '[data-ux="page"]' },
  { slug: 'saved-views', path: '/documents/views', wait: '[data-ux="page-title"]' },
];

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
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
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

async function main() {
  ensureDir(OUT);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const loginPage = await context.newPage();
  await login(loginPage);
  await loginPage.close();
  const state = await context.storageState();

  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      for (const route of ROUTES) {
        const page = await browser.newPage({
          storageState: state,
          viewport: { width, height: 900 },
        });
        await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
        await setTheme(page, theme);
        await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' });
        await page.waitForSelector(route.wait, { timeout: 60_000 });
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
