#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Layout workspace screenshots: 1440 + 390, light/dark, multi-page synthetic paper PDF.
 */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const EXPECT_SHA = execSync('git -C ' + REPO_ROOT + ' rev-parse HEAD').toString().trim();
const OUT =
  process.env.SCREENSHOT_DIR ?? '/cursor/stores/self/pr42-screenshots';
const PAPER_PDF =
  process.env.PAPER_PDF ??
  path.join(REPO_ROOT, 'tools/screenshots/layout/fixtures/synthetic-paper.pdf');
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';

const WIDTHS = [390, 1440];
const THEMES = ['light', 'dark'];

const captures = [];

const CAPTURE_ORDER = [
  'folders-root',
  'doc-original-page3',
  'doc-compare-strip',
  'doc-compare-retry',
  'doc-text-toolbar',
  'doc-tabellen-math',
  'doc-felder-absender',
];

function md5(buf) {
  return createHash('md5').update(buf).digest('hex');
}

const COMPANY_SUFFIX =
  /\b(GmbH|AG|UG|e\.?\s?K\.?|KG|OHG|SE|Inc\.|Ltd\.?|GmbH\s*&\s*Co\.?)\b/i;

function isHeadingLikeVendorValue(value) {
  const line = value.trim();
  if (!line) return false;
  const letters = line.replace(/[^A-Za-zÄÖÜäöüß]/gu, '');
  if (letters.length >= 12) {
    const upperRatio =
      letters.split('').filter((c) => c === c.toUpperCase() && c !== c.toLowerCase()).length /
      letters.length;
    if (upperRatio > 0.82 && !COMPANY_SUFFIX.test(line)) return true;
  }
  const words = line.split(/\s+/u);
  if (words.length >= 6 && !COMPANY_SUFFIX.test(line)) {
    const titleCase = words.filter((w) => w.length > 2 && w[0] === w[0]?.toUpperCase()).length;
    if (titleCase >= Math.max(4, words.length - 2)) return true;
  }
  return false;
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
}

async function assertBuildSha(page) {
  const sha = await page.evaluate(() => window.__DOCUVATE_BUILD_SHA__ ?? '');
  if (sha !== EXPECT_SHA) {
    throw new Error(`stale web build: expected ${EXPECT_SHA}, got ${sha || '(empty)'}`);
  }
}

async function prepareTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((pref) => {
    localStorage.setItem('docuvate-theme-preference', pref);
    localStorage.setItem('docuvate-theme', pref);
    document.documentElement.setAttribute('data-docuvate-theme', pref);
    window.dispatchEvent(new CustomEvent('docuvate-theme-preference-change'));
  }, theme);
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
    throw new Error(`upload failed: ${createRes.status()} ${await createRes.text()}`);
  }
  const created = await createRes.json();
  const id = created.id;
  const deadline = Date.now() + 600_000;
  while (Date.now() < deadline) {
    const stRes = await page.request.get(`${BASE}/api/v1/documents/${id}`);
    const doc = await stRes.json();
    if (doc.status === 'ready') {
      return { href: `/documents/${id}`, id };
    }
    if (doc.status === 'failed') {
      throw new Error(`extraction failed for ${baseName}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`timeout waiting for ${baseName}`);
}

async function scrollHeight(page) {
  return page.evaluate(() => {
    const main = document.querySelector('.app-main') ?? document.documentElement;
    const detail = document.querySelector('.document-detail-page');
    const nodes = [main, detail, document.documentElement].filter(Boolean);
    let height = 900;
    for (const node of nodes) {
      height = Math.max(height, node.scrollHeight, node.clientHeight);
    }
    return Math.min(height + 48, 16000);
  });
}

async function captureState(page, stateId, establish) {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      await prepareTheme(page, theme);
      const height = width <= 390 ? Math.max(844, await scrollHeight(page)) : Math.max(900, await scrollHeight(page));
      await page.setViewportSize({ width, height });
      await establish(page, width);
      await page.waitForTimeout(400);
      const file = path.join(OUT, `${stateId}-${width}-${theme}.png`);
      await page.screenshot({ path: file, fullPage: false });
      captures.push({
        stateId,
        width,
        theme,
        file: path.basename(file),
        md5: md5(await readFile(file)),
      });
    }
  }
}

async function warmupLayoutCompare(page, documentId) {
  const origin = new URL(BASE).origin;
  const summary = await page.request.get(
    `${origin}/api/v1/documents/${documentId}/layout-compare/summary`
  );
  if (!summary.ok()) {
    throw new Error(`compare summary warmup failed: ${summary.status()} ${await summary.text()}`);
  }
  const pageRes = await page.request.get(
    `${origin}/api/v1/documents/${documentId}/layout-compare/pages/1?heatmap=0`
  );
  if (!pageRes.ok()) {
    throw new Error(`compare page warmup failed: ${pageRes.status()} ${await pageRes.text()}`);
  }
  const body = await pageRes.json();
  if (body.errorCode) {
    throw new Error(`compare page 1 error: ${body.errorCode}`);
  }
}

async function enterCompareMode(page) {
  await page.locator('.layout-workspace').waitFor({ timeout: 120_000 });
  await page.getByRole('button', { name: /^vergleich$/i }).click();
  await page
    .getByText(/vergleich wird berechnet|layout compare/i)
    .first()
    .waitFor({ state: 'hidden', timeout: 300_000 })
    .catch(() => undefined);
  const stage = page.getByTestId('layout-compare-stage');
  const errorPanel = page.locator('.layout-compare-error');
  await Promise.race([
    stage.waitFor({ state: 'attached', timeout: 300_000 }),
    errorPanel.waitFor({ state: 'visible', timeout: 300_000 }),
  ]);
  if (await errorPanel.count()) {
    const msg = await errorPanel.locator('.error').first().textContent();
    throw new Error(`compare error UI: ${msg ?? 'unknown'}`);
  }
  await stage.scrollIntoViewIfNeeded();
  await page.locator('[data-testid="layout-compare-stage"] img').first().waitFor({
    state: 'visible',
    timeout: 300_000,
  });
  await page.getByText(/SSIM:\s*\d/i).first().waitFor({ timeout: 300_000 });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ locale: 'de-DE' });
  await login(page);
  await assertBuildSha(page);

  const resumeHref = process.env.PAPER_DOC_HREF;
  const paper = resumeHref
    ? { href: resumeHref, id: resumeHref.replace(/^\/documents\//, '') }
    : await uploadPdf(page, PAPER_PDF);
  await warmupLayoutCompare(page, paper.id);

  const skipThrough = process.env.SCREENSHOT_RESUME_AFTER ?? '';
  const skipIndex = skipThrough ? CAPTURE_ORDER.indexOf(skipThrough) : -1;
  const shouldCapture = (stateId) => {
    const index = CAPTURE_ORDER.indexOf(stateId);
    return skipIndex < 0 || index > skipIndex;
  };

  if (shouldCapture('folders-root')) {
  await captureState(page, 'folders-root', async (p) => {
    await p.goto(`${BASE}/filesystem`, { waitUntil: 'networkidle' });
    await assertBuildSha(p);
    await p.locator('.dateisystem-root-empty, .dateisystem-root-overview').first().waitFor({
      timeout: 30_000,
    });
  });
  }

  if (shouldCapture('doc-original-page3')) {
  await captureState(page, 'doc-original-page3', async (p, width) => {
    await p.goto(`${BASE}${paper.href}`, { waitUntil: 'networkidle' });
    await assertBuildSha(p);
    await p.getByRole('button', { name: /^original$/i }).click();
    const nextPage = p.getByRole('button', { name: /nächste seite|next page/i });
    await nextPage.waitFor({ state: 'visible', timeout: 120_000 });
    await nextPage.click();
    await nextPage.click();
    await p.getByText(/seite\s*3\s*von/i).first().waitFor({ timeout: 120_000 });
    const canvas = p.locator('.pdf-page-slot[data-page="3"] .pdf-page-canvas, .pdf-page-canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 120_000 });
    await p.waitForFunction(
      () => {
        const el = document.querySelector('.pdf-page-slot[data-page="3"] .pdf-page-canvas, .pdf-page-canvas');
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 120 && rect.height > 120;
      },
      undefined,
      { timeout: 120_000 }
    );
    if (width <= 390) {
      await p.locator('.layout-side-panel').scrollIntoViewIfNeeded();
    }
  });
  }

  if (shouldCapture('doc-compare-strip')) {
  await captureState(page, 'doc-compare-strip', async (p, width) => {
    await p.goto(`${BASE}${paper.href}`, { waitUntil: 'networkidle' });
    await warmupLayoutCompare(p, paper.id);
    await enterCompareMode(p);
    await p.locator('.layout-compare-page-strip-virtual, .layout-compare-page-chip').first().waitFor({
      timeout: 180_000,
    });
    const chips = await p.locator('.layout-compare-page-chip').count();
    if (chips > 30) {
      throw new Error(`compare strip not virtualized: ${chips} chips`);
    }
    if (width <= 390) {
      await p.locator('.layout-side-panel').scrollIntoViewIfNeeded();
    }
  });
  }

  if (shouldCapture('doc-compare-retry')) {
  await captureState(page, 'doc-compare-retry', async (p) => {
    await p.goto(`${BASE}${paper.href}`, { waitUntil: 'networkidle' });
    await warmupLayoutCompare(p, paper.id);
    await enterCompareMode(p);
    const jump = p.locator('.layout-compare-page-jump input');
    await jump.fill('16');
    await jump.press('Enter');
    await p.getByText(/SSIM:\s*\d/i).first().waitFor({ timeout: 300_000 });
    if (await p.locator('.layout-compare-error').count()) {
      throw new Error('compare page 16 shows error panel');
    }
  });
  }

  if (shouldCapture('doc-text-toolbar')) {
  await captureState(page, 'doc-text-toolbar', async (p) => {
    await p.goto(`${BASE}${paper.href}`, { waitUntil: 'networkidle' });
    await p.getByRole('button', { name: /^text$/i }).first().click();
    const textBtn = p.getByRole('button', { name: /^text$|fertig$/i }).first();
    const box = await textBtn.boundingBox();
    const vp = p.viewportSize();
    if (!box || !vp || box.x + box.width > vp.width - 4) {
      throw new Error('text mode toggle clipped');
    }
  });
  }

  if (shouldCapture('doc-tabellen-math')) {
  await captureState(page, 'doc-tabellen-math', async (p, width) => {
    await p.goto(`${BASE}${paper.href}`, { waitUntil: 'networkidle' });
    await p.getByRole('tab', { name: /^tabellen$/i }).click();
    await p.locator('.layout-data-table').first().waitFor({ timeout: 120_000 });
    const cells = p.locator('.layout-data-table td');
    const cellCount = await cells.count();
    if (cellCount === 0) {
      throw new Error('layout table has no cells');
    }
    for (let i = 0; i < Math.min(cellCount, 24); i += 1) {
      const text = (await cells.nth(i).textContent()) ?? '';
      if (text.includes('Seite1') || text.includes('Kostenin') || text.includes('1.234, 56')) {
        throw new Error(`table cell corrupted: ${text}`);
      }
      if (text.includes('μ;') || text.includes('Σ;')) {
        throw new Error(`math cell fragmented: ${text}`);
      }
      if (
        text.includes('μ') &&
        text.includes('Σ') &&
        !/μ\s*(?:,|\s)\s*Σ/u.test(text)
      ) {
        throw new Error(`math cell tokens fused: ${text}`);
      }
    }
    if (width <= 390) {
      await p.locator('.layout-side-panel').scrollIntoViewIfNeeded();
    }
  });
  }

  if (shouldCapture('doc-felder-absender')) {
  await captureState(page, 'doc-felder-absender', async (p, width) => {
    await p.goto(`${BASE}${paper.href}`, { waitUntil: 'networkidle' });
    await p.getByRole('tab', { name: /^felder$/i }).click();
    await p.locator('.layout-side-fields').waitFor({ timeout: 120_000 });
    const suggestion = p.locator('.layout-field-suggestion-tag');
    const fieldRow = p.locator('.layout-field-row');
    if ((await suggestion.count()) === 0 && (await fieldRow.count()) === 0) {
      throw new Error('felder panel has no field rows');
    }
    const suggestionValues = await p.locator('.layout-field-value').allTextContents();
    for (const value of suggestionValues) {
      if (isHeadingLikeVendorValue(value)) {
        throw new Error(`heading-like vendor suggestion: ${value}`);
      }
    }
    if (width <= 390) {
      await p.locator('.layout-side-panel').scrollIntoViewIfNeeded();
    }
  });
  }

  const existingFiles = await readdir(OUT);
  for (const file of existingFiles) {
    if (!file.endsWith('.png')) continue;
    const match = /^(.+)-(390|1440)-(light|dark)\.png$/u.exec(file);
    if (!match) continue;
    const already = captures.some((c) => c.file === file);
    if (already) continue;
    const filePath = path.join(OUT, file);
    captures.push({
      stateId: match[1],
      width: Number(match[2]),
      theme: match[3],
      file,
      md5: md5(await readFile(filePath)),
    });
  }

  const manifest = {
    buildSha: EXPECT_SHA,
    capturedAt: new Date().toISOString(),
    paperPdf: path.basename(PAPER_PDF),
    captures,
  };
  await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await browser.close();
  console.log(`Wrote ${captures.length} screenshots to ${OUT} (sha ${EXPECT_SHA})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
