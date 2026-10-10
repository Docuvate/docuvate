#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Document layout workspace screenshots (full page + optional viewport proof).
 */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const EXPECT_SHA = execSync('git -C ' + REPO_ROOT + ' rev-parse HEAD').toString().trim();
const OUT = process.env.SCREENSHOT_DIR
  ? path.resolve(process.env.SCREENSHOT_DIR)
  : '/opt/cursor/artifacts/layout-screenshots';
const FIXTURES = path.join(__dirname, 'fixtures');
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';

const WIDTHS = [390, 1024, 1440];
const THEMES = ['light', 'dark'];
const THEME_PREF_KEY = 'docuvate-theme-preference';
const THEME_COMPACT_KEY = 'docuvate-theme';

const captures = [];

function md5(buf) {
  return createHash('md5').update(buf).digest('hex');
}

async function recordCapture(filePath, stateName, width, theme, kind) {
  const hash = md5(await readFile(filePath));
  captures.push({ stateName, width, theme, kind, hash, filePath });
}

function assertCaptureQuality() {
  for (const stateName of new Set(captures.map((c) => c.stateName))) {
    for (const width of WIDTHS) {
      const light = captures.find(
        (c) => c.stateName === stateName && c.width === width && c.theme === 'light' && c.kind === 'full'
      );
      const dark = captures.find(
        (c) => c.stateName === stateName && c.width === width && c.theme === 'dark' && c.kind === 'full'
      );
      if (!light || !dark) throw new Error(`missing theme pair for ${stateName} @ ${width}`);
      if (light.hash === dark.hash) {
        throw new Error(`light==dark for ${stateName} @ ${width}`);
      }
    }
  }
  const pairs = [
    ['felder-vorschlag', 'gliederung-jump'],
    ['felder-vorschlag', 'overlay-popover'],
    ['nachbau-unreliable', 'landscape'],
    ['landscape', 'scanned'],
  ];
  for (const [a, b] of pairs) {
    for (const width of WIDTHS) {
      const shotA = captures.find(
        (c) => c.stateName === a && c.width === width && c.theme === 'light' && c.kind === 'full'
      );
      const shotB = captures.find(
        (c) => c.stateName === b && c.width === width && c.theme === 'light' && c.kind === 'full'
      );
      if (shotA && shotB && shotA.hash === shotB.hash) {
        throw new Error(`${a} == ${b} at ${width}px light`);
      }
    }
  }
}

async function login(page) {
  const origin = new URL(BASE).origin;
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  const res = await page.request.post(`${BASE}/api/auth/sign-in/email`, {
    headers: { Origin: origin, Referer: `${origin}/login` },
    data: { email: EMAIL, password: PASSWORD },
  });
  if (!res.ok()) {
    throw new Error(`sign-in failed: ${res.status()} ${await res.text()}`);
  }
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
}

async function assertBuildSha(page) {
  const sha = await page.evaluate(() => window.__DOCUVATE_BUILD_SHA__ ?? '');
  if (sha !== EXPECT_SHA) {
    throw new Error(`stale web build: expected ${EXPECT_SHA}, got ${sha || '(empty)'}`);
  }
}

async function prepareTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate(
    ([prefKey, compactKey, pref]) => {
      localStorage.setItem(prefKey, pref);
      localStorage.setItem(compactKey, pref);
      document.documentElement.setAttribute('data-docuvate-theme', pref);
      window.dispatchEvent(new CustomEvent('docuvate-theme-preference-change'));
    },
    [THEME_PREF_KEY, THEME_COMPACT_KEY, theme]
  );
  const attr = await page.evaluate(() => document.documentElement.getAttribute('data-docuvate-theme'));
  if (attr !== theme) throw new Error(`theme attr ${attr} != ${theme}`);
}

async function uploadPdf(page, filePath) {
  const baseName = path.basename(filePath);
  const buffer = await readFile(filePath);
  const createRes = await page.request.post(`${BASE}/api/v1/documents`, {
    multipart: {
      file: {
        name: baseName,
        mimeType: 'application/pdf',
        buffer,
      },
    },
  });
  if (!createRes.ok()) {
    throw new Error(`upload failed for ${baseName}: ${createRes.status()} ${await createRes.text()}`);
  }
  const created = await createRes.json();
  const id = created.id;
  const deadline = Date.now() + 300_000;
  while (Date.now() < deadline) {
    const stRes = await page.request.get(`${BASE}/api/v1/documents/${id}`);
    if (!stRes.ok()) throw new Error(`status poll failed: ${stRes.status()}`);
    const doc = await stRes.json();
    if (doc.status === 'ready') {
      return { href: `/documents/${id}`, id };
    }
    if (doc.status === 'failed') {
      throw new Error(`extraction failed for ${baseName}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`timeout waiting for ready: ${baseName}`);
}

async function openDoc(page, href) {
  await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle' });
  await assertBuildSha(page);
  await page.locator('.layout-workspace').waitFor({ timeout: 120_000 });
  await page.locator('.pdf-page-canvas').first().waitFor({ state: 'visible', timeout: 120_000 });
}

async function scrollHeightForCapture(page) {
  return page.evaluate(() => {
    const main = document.querySelector('.app-main');
    const pageRoot = document.querySelector('.document-detail-page');
    const nodes = [main, pageRoot, document.documentElement, document.body].filter(Boolean);
    let height = 0;
    let width = 0;
    for (const node of nodes) {
      height = Math.max(height, node.scrollHeight, node.clientHeight);
      width = Math.max(width, node.scrollWidth, node.clientWidth);
    }
    const panel = document.querySelector('.layout-side-panel');
    if (panel) {
      const rect = panel.getBoundingClientRect();
      height = Math.max(height, rect.bottom + window.scrollY + 24);
    }
    return { height, width };
  });
}

async function captureExpandedScreenshot(page, filePath, width) {
  const { height, width: contentWidth } = await scrollHeightForCapture(page);
  const targetWidth = Math.max(width, contentWidth);
  let targetHeight = Math.min(Math.max(height + 48, width <= 390 ? 1500 : 900), 16000);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.setViewportSize({ width: targetWidth, height: targetHeight });
    await page.waitForTimeout(250);
    if (width > 390) break;
    const panel = page.locator('.layout-side-panel');
    if ((await panel.count()) === 0) break;
    const box = await panel.boundingBox();
    const vp = page.viewportSize();
    if (!box || !vp || box.y + box.height <= vp.height - 12) break;
    targetHeight = Math.min(targetHeight + 500, 16000);
  }
  await page.screenshot({ path: filePath, fullPage: false });
  if (width <= 390) {
    const panel = page.locator('.layout-side-panel');
    if (await panel.count()) {
      const box = await panel.boundingBox();
      const vp = page.viewportSize();
      if (box && vp && box.y + box.height > vp.height - 12) {
        throw new Error(`390px shot clips side panel in ${path.basename(filePath)}`);
      }
    }
  }
}

async function stubUnreliableReconstruction(page, documentId) {
  await page.route(`**/documents/${documentId}/layout-html**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        html:
          '<!doctype html><html><body><div class="page" style="width:420px;height:560px;background:#fff;padding:1rem"><p>Scan-Nachbau</p></div></body></html>',
        reconstructionReliable: false,
        unreliableReason: 'ocr_low_confidence',
      }),
    });
  });
}

async function captureMatrix(page, stateName, establishState, assertState) {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      await prepareTheme(page, theme);
      const height = width <= 390 ? 844 : width >= 1440 ? 900 : Math.max(900, Math.round(width * 0.72));
      await page.setViewportSize({ width, height });
      await establishState(page, width, theme);
      await assertState(page, width, theme);
      await page.waitForTimeout(300);
      const base = `${stateName}-${width}-${theme}`;
      const fullPath = path.join(OUT, `${base}.png`);
      await captureExpandedScreenshot(page, fullPath, width);
      await recordCapture(fullPath, stateName, width, theme, 'full');
      if (width === 1440 && theme === 'light') {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.waitForTimeout(200);
        const vpPath = path.join(OUT, `${base}-viewport.png`);
        await page.screenshot({ path: vpPath, fullPage: false });
        await recordCapture(vpPath, stateName, width, theme, 'viewport');
        const fullHash = md5(await readFile(fullPath));
        const vpHash = md5(await readFile(vpPath));
        if (fullHash === vpHash) {
          throw new Error(`full-page shot matches viewport for ${base}`);
        }
      }
    }
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();
  await login(page);

  const brutto = await uploadPdf(page, path.join(FIXTURES, 'layout-ws-brutto.pdf'));
  const landscape = await uploadPdf(page, path.join(FIXTURES, 'layout-ws-landscape.pdf'));
  const scanned = await uploadPdf(page, path.join(FIXTURES, 'layout-ws-scanned.pdf'));
  const multipage = await uploadPdf(page, path.join(FIXTURES, 'layout-ws-multipage.pdf'));

  const docIds = {
    brutto: brutto.id,
    landscape: landscape.id,
    scanned: scanned.id,
    multipage: multipage.id,
  };
  await writeFile(path.join(__dirname, 'doc-ids.json'), JSON.stringify(docIds, null, 2));
  await writeFile(path.join(OUT, 'doc-ids.json'), JSON.stringify(docIds, null, 2));
  execSync('node tools/screenshots/layout/seed-layout-docs.mjs', {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: { ...process.env, LAYOUT_DOC_MAP: path.join(__dirname, 'doc-ids.json') },
  });

  await openDoc(page, brutto.href);
  await captureMatrix(
    page,
    'felder-vorschlag',
    async (p, width) => {
      await p.getByRole('tab', { name: /^felder$/i }).click();
      await p.getByText(/vorschlag/i).first().waitFor({ timeout: 60_000 });
      if (width <= 390) await p.locator('.layout-side-panel').scrollIntoViewIfNeeded();
    },
    async (p) => {
      await p.getByRole('tab', { name: /^felder$/i }).click();
      await p.getByText(/vorschlag/i).first().waitFor({ state: 'visible' });
      const tag = p.locator('.layout-field-suggestion-tag');
      await tag.waitFor({ state: 'visible' });
      const rows = p.locator('.layout-field-row');
      const rowCount = await rows.count();
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const label = (await row.locator('.layout-field-label').textContent()) ?? '';
        const value = (await row.locator('.layout-field-value').textContent()) ?? '';
        if (/absender/i.test(label) && /absender\s*:/i.test(value)) {
          throw new Error(`Absender field value must not repeat label prefix: ${value}`);
        }
      }
    }
  );

  await openDoc(page, brutto.href);
  await captureMatrix(
    page,
    'overlay-popover',
    async (p) => {
      const overlay = p.locator('.pdf-layout-overlay-field').first();
      await overlay.waitFor({ state: 'visible', timeout: 30_000 });
      await overlay.hover();
      await p.locator('.layout-overlay-popover').waitFor({ state: 'visible', timeout: 15_000 });
    },
    async (p) => {
      await p.locator('.layout-overlay-popover').waitFor({ state: 'visible' });
    }
  );

  await stubUnreliableReconstruction(page, scanned.id);
  await openDoc(page, scanned.href);
  await captureMatrix(
    page,
    'nachbau-unreliable',
    async (p) => {
      await p.getByRole('button', { name: /^nachbau$/i }).click();
      await p.getByText(/nicht verlässlich/i).first().waitFor({ state: 'visible', timeout: 120_000 });
    },
    async (p) => {
      const nachbau = p.getByRole('button', { name: /^nachbau$/i });
      await nachbau.waitFor({ state: 'visible' });
      if ((await nachbau.getAttribute('aria-pressed')) !== 'true') {
        throw new Error('Nachbau toggle not active');
      }
      await p.getByText(/nicht verlässlich/i).first().waitFor({ state: 'visible' });
      const original = p.getByRole('button', { name: /^original$/i });
      if ((await original.getAttribute('aria-pressed')) === 'true') {
        throw new Error('Original toggle still active in nachbau state');
      }
    }
  );

  await openDoc(page, landscape.href);
  await captureMatrix(
    page,
    'landscape',
    async () => undefined,
    async (p) => {
      const box = await p.locator('.pdf-page-canvas').first().boundingBox();
      if (!box || box.width <= box.height) {
        throw new Error(`expected landscape canvas, got ${box?.width}x${box?.height}`);
      }
      const body = await p.locator('.pdf-viewer-scroll .textLayer').textContent();
      if (!body?.includes('QUERFORMAT-FIXTURE')) {
        throw new Error('landscape fixture text missing');
      }
    }
  );

  await openDoc(page, scanned.href);
  await captureMatrix(
    page,
    'scanned',
    async (p, width) => {
      await p.getByRole('button', { name: /^original$/i }).click();
      await p.getByRole('tab', { name: /^felder$/i }).click();
      const overlay = p.locator('.pdf-layout-overlay, .pdf-page-canvas').first();
      await overlay.waitFor({ state: 'visible' });
      if (width <= 390) await p.locator('.layout-side-panel').scrollIntoViewIfNeeded();
    },
    async (p) => {
      const pressed = await p.getByRole('button', { name: /^original$/i }).getAttribute('aria-pressed');
      if (pressed !== 'true') throw new Error('scanned state expects Original mode');
      const text = await p.locator('.pdf-viewer-scroll').textContent();
      if (text?.includes('QUERFORMAT-FIXTURE')) {
        throw new Error('scanned doc shows landscape fixture text');
      }
      if (!text?.includes('Invoice SYN-9001')) {
        throw new Error('scanned OCR fixture text missing');
      }
    }
  );

  await openDoc(page, multipage.href);
  await captureMatrix(
    page,
    'gliederung-jump',
    async (p, width) => {
      await p.getByRole('tab', { name: /^gliederung$/i }).click();
      await p.locator('.layout-outline-item').first().click();
      await p.locator('.layout-outline-item-active').first().waitFor({ timeout: 30_000 });
      if (width <= 390) await p.locator('.layout-side-panel').scrollIntoViewIfNeeded();
    },
    async (p) => {
      await p.getByRole('tab', { name: /^gliederung$/i }).click();
      await p.locator('.layout-outline-item-active').first().waitFor({ state: 'visible' });
      const gliederung = p.getByRole('tab', { name: /^gliederung$/i });
      if ((await gliederung.getAttribute('aria-selected')) !== 'true') {
        throw new Error('Gliederung tab not selected');
      }
    }
  );

  assertCaptureQuality();
  await browser.close();
  console.log(`Captured ${captures.length} images to ${OUT} (build ${EXPECT_SHA})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
