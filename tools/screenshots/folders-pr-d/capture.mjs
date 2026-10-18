#!/usr/bin/env node
/**
 * PR-D folder screens (O1, O1b, O2, O3) at 1440 / 1024 / 390, light + dark.
 *
 * Requires: docker compose (API + DB), `pnpm --filter @docuvate/web dev`, seeded demo tree.
 *
 *   node tools/screenshots/ordnerbaum/seed.mjs
 *   SCREENSHOT_DIR=docs/screenshots/pr-104 node tools/screenshots/folders-pr-d/capture.mjs
 */
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.resolve(ROOT, process.env.SCREENSHOT_DIR ?? 'docs/screenshots/pr-104');
const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 900 },
  { width: 390, height: 844 },
];

function refreshSeed() {
  const webOrigin = new URL(BASE).origin;
  const authOrigin = process.env.E2E_AUTH_ORIGIN ?? webOrigin;
  return JSON.parse(
    execSync('node tools/screenshots/ordnerbaum/seed.mjs', {
      cwd: ROOT,
      timeout: 300_000,
      env: {
        ...process.env,
        WEB_ORIGIN: authOrigin,
        AUTH_BASE: process.env.AUTH_BASE ?? `${new URL(authOrigin).origin}/api/auth`,
        API_BASE: process.env.API_BASE ?? `${new URL(authOrigin).origin.replace(/:\d+$/, ':3001')}/v1`,
        DATABASE_URL:
          process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@localhost:5433/docuvate',
      },
    }).toString()
  );
}

async function addSession(context, authCookie, host) {
  await context.addCookies([
    {
      name: 'better-auth.session_token',
      value: decodeURIComponent(authCookie),
      domain: host,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function setTheme(page, theme) {
  await page.evaluate((mode) => {
    document.documentElement.dataset.theme = mode;
    window.localStorage.setItem('docuvate.theme', mode);
  }, theme);
}

async function setLocale(page, locale) {
  await page.evaluate((lng) => {
    window.localStorage.setItem('docuvate.locale', lng);
  }, locale);
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`wrote ${file}`);
}

async function openPopulatedFolder(page, folderId) {
  await page.goto(`${BASE}/filesystem/folders/${folderId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.dateisystem-shell').waitFor({ state: 'visible', timeout: 45_000 });
  await page.locator('.library-doc-table-card .library-document-grid-card, .library-doc-table-card tbody tr').first().waitFor({
    state: 'visible',
    timeout: 45_000,
  });
}

async function openEmptyFolder(page, folderId) {
  await page.goto(`${BASE}/filesystem/folders/${folderId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.dateisystem-folder-empty').waitFor({ state: 'visible', timeout: 45_000 });
}

async function captureO1bDrag(page) {
  const handle = page.locator('.library-document-grid-card, .library-doc-stack-item').first();
  const box = await handle.boundingBox();
  if (!box) throw new Error('No document tile for O1b drag');
  const target = page.locator('.filesystem-folder-tile, .dateisystem-tree-link').first();
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error('No folder drop target for O1b');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 12,
  });
  await page.waitForTimeout(300);
}

async function openMoveDialog(page) {
  const checkbox = page.locator('.library-doc-table-card input[type="checkbox"]').first();
  await checkbox.check();
  await page.getByRole('button', { name: /Verschieben|Move/i }).click();
  await page.locator('.dv-dialog').waitFor({ state: 'visible', timeout: 10_000 });
}

async function main() {
  const seed = refreshSeed();
  const { authCookie, direktFolderId, reisekostenFolderId } = seed;
  if (!direktFolderId || !reisekostenFolderId) {
    throw new Error('seed must return direktFolderId and reisekostenFolderId');
  }

  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const host = new URL(BASE).hostname;

  for (const locale of ['de', 'en']) {
    for (const theme of ['light', 'dark']) {
      for (const { width, height } of VIEWPORTS) {
        const context = await browser.newContext({ viewport: { width, height } });
        await addSession(context, authCookie, host);
        const page = await context.newPage();
        await setLocale(page, locale);
        await setTheme(page, theme);

        const tag = `${locale}-${theme}-${width}`;

        await openPopulatedFolder(page, direktFolderId);
        await shot(page, `O1-${tag}.png`);

        await captureO1bDrag(page);
        await shot(page, `O1b-${tag}.png`);
        await page.mouse.up();

        await openEmptyFolder(page, reisekostenFolderId);
        await page.locator('.dateisystem-folder-dropzone').evaluate((el) => {
          el.classList.add('is-drag-over');
        });
        await shot(page, `O2-${tag}.png`);

        await openPopulatedFolder(page, direktFolderId);
        await openMoveDialog(page);
        await shot(page, `O3-${tag}.png`);

        await context.close();
      }
    }
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
