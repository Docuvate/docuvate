#!/usr/bin/env node
/**
 * PR #45 acceptance captures: layout viewer modes + chat tab at repo HEAD.
 * Prereq: stack up, seed-e2e-smoke-user.mjs. Set LAYOUT_SCREENSHOT_OUT (Agent Store path).
 */
import { chromium } from 'playwright';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const WEB = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const OUT = process.env.LAYOUT_SCREENSHOT_OUT ?? join(process.cwd(), 'artifacts/screenshots/pr45');
const AUTH = `${WEB}/api/auth`;
const API = `${WEB}/api/v1`;
const ORIGIN = new URL(WEB).origin;
const HEAD_SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
const authHeaders = { Origin: ORIGIN, Referer: `${ORIGIN}/` };
const email = process.env.E2E_SMOKE_EMAIL ?? 'alex.upload@fixture.docuvate.test';
const password = process.env.E2E_SMOKE_PASSWORD ?? 'E2eSmokeFixture1!';

function syntheticFixturesDir() {
  const dir = mkdtempSync(join(tmpdir(), 'docuvate-pr45-fixtures-'));
  const script = `
import sys
from pathlib import Path
sys.path.insert(0, ${JSON.stringify(join(process.cwd(), 'apps/worker/tests'))})
from synthetic_layout_pdfs import delivery_note_table_pdf
Path(${JSON.stringify(join(dir, 'sample_delivery_note.pdf'))}).write_bytes(delivery_note_table_pdf())
`;
  const result = spawnSync('python3', ['-c', script], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || 'fixture PDF build failed');
  }
  return dir;
}

const FIXTURES = syntheticFixturesDir();

async function apiLogin(context) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let res = await context.request.post(`${AUTH}/sign-in/email`, {
      headers: authHeaders,
      data: { email, password },
    });
    if (res.status() === 429) {
      await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
      continue;
    }
    if (!res.ok()) {
      await context.request.post(`${AUTH}/sign-up/email`, {
        headers: authHeaders,
        data: { email, password, name: 'Alex Testmann' },
      });
      res = await context.request.post(`${AUTH}/sign-in/email`, {
        headers: authHeaders,
        data: { email, password },
      });
    }
    if (res.ok()) return;
    if (res.status() === 429) continue;
    throw new Error(`login failed ${res.status()}`);
  }
  throw new Error('login rate limited');
}

async function uploadDeliveryNote(request) {
  const buffer = readFileSync(join(FIXTURES, 'sample_delivery_note.pdf'));
  const res = await request.post(`${API}/documents`, {
    headers: authHeaders,
    multipart: {
      file: { name: 'sample_delivery_note.pdf', mimeType: 'application/pdf', buffer },
    },
  });
  if (!res.ok()) throw new Error(`upload failed ${res.status()}`);
  const doc = await res.json();
  const deadline = Date.now() + 300_000;
  while (Date.now() < deadline) {
    const detail = await request.get(`${API}/documents/${doc.id}`, { headers: authHeaders });
    const body = await detail.json();
    if (body.status === 'ready' && body.extraction?.layoutIrAvailable) return body.id;
    if (body.status === 'failed') throw new Error('extraction failed');
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('timeout waiting for layout IR');
}

async function capture(page, name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false });
  return name;
}

async function openLayout(page, docId) {
  await page.goto(`${WEB}/documents/${docId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.badge-ready, .badge.badge-ready').first().waitFor({
    state: 'visible',
    timeout: 300_000,
  });
  await page.locator('.layout-workspace').waitFor({ state: 'visible', timeout: 300_000 });
  await page.locator('.pdf-page-canvas, .layout-ir-html-frame, .layout-compare-stage').first().waitFor({
    state: 'visible',
    timeout: 300_000,
  });
  await page.waitForTimeout(600);
}

async function setTheme(page, theme) {
  await page.locator('.user-account-menu-trigger').click();
  const panel = page.locator('.user-account-menu-panel');
  await panel.waitFor({ state: 'visible', timeout: 15_000 });
  const segment = theme === 'dark' ? /Dark|Dunkel/i : /Light|Hell/i;
  await panel.getByRole('radio', { name: segment }).click();
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-docuvate-theme') === t,
    theme,
    { timeout: 15_000 }
  );
  await page.keyboard.press('Escape');
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const files = [];
  const context = await browser.newContext({ locale: 'en-US' });
  await apiLogin(context);
  const docId = await uploadDeliveryNote(context.request);
  const page = await context.newPage();

  for (const viewport of [
    { tag: '1440', width: 1440, height: 900 },
    { tag: '390', width: 390, height: 844 },
  ]) {
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openLayout(page, docId);
      await setTheme(page, theme);

      await page.getByRole('button', { name: /^Original$/i }).click();
      files.push(await capture(page, `original-${viewport.tag}-${theme}.png`));

      await page.getByRole('button', { name: /^Reconstruction$/i }).click();
      await page.locator('.layout-ir-html-frame').waitFor({ state: 'visible', timeout: 120_000 });
      files.push(await capture(page, `reconstruction-${viewport.tag}-${theme}.png`));

      await page.getByRole('button', { name: /^Compare$/i }).click();
      await page.getByRole('button', { name: /Side by side|Nebeneinander/i }).click();
      await page.locator('.layout-compare-split').waitFor({ state: 'visible', timeout: 120_000 });
      files.push(await capture(page, `compare-split-${viewport.tag}-${theme}.png`));

      await page.getByRole('button', { name: /Slider|Schieberegler/i }).click();
      files.push(await capture(page, `compare-slider-${viewport.tag}-${theme}.png`));

      await page.getByRole('tab', { name: /^Chat$/i }).click();
      await page.locator('.layout-side-panel-chat').waitFor({ state: 'visible', timeout: 30_000 });
      files.push(await capture(page, `chat-tab-${viewport.tag}-${theme}.png`));
    }
  }

  writeFileSync(
    join(OUT, 'manifest.json'),
    `${JSON.stringify({ headSha: HEAD_SHA, buildSha: HEAD_SHA, files }, null, 2)}\n`
  );
  await browser.close();
  console.log('wrote', OUT, 'head', HEAD_SHA);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
