#!/usr/bin/env node
/**
 * Connector screens (E3–E7): catalog, connect dialog, connection detail, sources.
 * Viewports 1440 / 1024 / 390, light and dark. No processed documents required.
 *
 *   node tools/screenshots/connectors/capture.mjs
 *
 * Env: SCREENSHOT_BASE_URL (default http://localhost:5173)
 */
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT =
  process.env.SCREENSHOT_DIR ?? path.join(REPO_ROOT, 'artifacts/screenshots/connectors');
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const AUTH = `${BASE}/api/auth`;
const API = `${BASE}/api/v1`;
const ORIGIN = new URL(BASE).origin;
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? 'connectors-screenshots@fixture.docuvate.test';
const PASSWORD = process.env.SCREENSHOT_USER_PASSWORD ?? 'ConnectorsScreenshot1!';
const NAME = process.env.SCREENSHOT_USER_NAME ?? 'Connectors Screenshot';

const VIEWPORTS = [
  { id: '1440', width: 1440, height: 900 },
  { id: '1024', width: 1024, height: 768 },
  { id: '390', width: 390, height: 844 },
];

const authHeaders = { Origin: ORIGIN, Referer: `${ORIGIN}/` };

await mkdir(OUT, { recursive: true });

async function apiLogin(context) {
  let res = await context.request.post(`${AUTH}/sign-in/email`, {
    headers: authHeaders,
    data: { email: EMAIL, password: PASSWORD },
  });
  if (!res.ok()) {
    await context.request.post(`${AUTH}/sign-up/email`, {
      headers: authHeaders,
      data: { email: EMAIL, password: PASSWORD, name: NAME },
    });
    res = await context.request.post(`${AUTH}/sign-in/email`, {
      headers: authHeaders,
      data: { email: EMAIL, password: PASSWORD },
    });
  }
  if (!res.ok()) throw new Error(`login failed ${res.status()}`);
}

async function ensureSftpInstallation(context) {
  const list = await context.request.get(`${API}/connectors/installations`, {
    headers: authHeaders,
  });
  if (!list.ok()) throw new Error(`list installations ${list.status()}`);
  const body = await list.json();
  const existing = (body.installations ?? []).find(
    (row) => row.pluginId === 'sftp_fetch' && row.displayName === 'Scanner SFTP Zuhause'
  );
  if (existing) return existing.id;
  const create = await context.request.post(`${API}/connectors/installations`, {
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    data: {
      pluginId: 'sftp_fetch',
      displayName: 'Scanner SFTP Zuhause',
      credentials: {
        host: 'sftp.example.test',
        port: '22',
        username: 'scan',
        password: 'scan-secret',
        host_key_fingerprint_sha256: 'SHA256:fixture',
        after_import: 'delete',
        poll_interval_seconds: '60',
        target_folder_id: '',
        label_ids: '',
      },
      sourceScope: { mode: 'selected', paths: ['inbox/'] },
    },
  });
  if (!create.ok()) {
    const text = await create.text();
    throw new Error(`create installation ${create.status()} ${text}`);
  }
  const created = await create.json();
  return created.id;
}

async function applyTheme(page, theme) {
  await page.evaluate((pref) => {
    localStorage.setItem('docuvate-theme-preference', pref);
    localStorage.setItem('docuvate-theme', pref);
    document.documentElement.setAttribute('data-docuvate-theme', pref);
  }, theme);
}

async function shot(page, fileName) {
  await page.screenshot({ path: path.join(OUT, fileName), fullPage: true });
}

async function captureSet(browser, theme, installationId) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await apiLogin(context);
    const page = await context.newPage();
    await applyTheme(page, theme);

    await page.goto(`${BASE}/settings/connectors`, { waitUntil: 'networkidle' });
    await page.locator('.connector-catalog-grid, .connector-catalog-toolbar').first().waitFor({
      timeout: 30_000,
    });
    await shot(page, `${SHA}-connectors-catalog-${vp.id}-${theme}.png`);

    await page.getByRole('button', { name: /Verbinden|Connect/i }).first().click();
    await page.locator('.connector-connect-dialog').waitFor({ state: 'visible', timeout: 15_000 });
    await shot(page, `${SHA}-connectors-dialog-access-${vp.id}-${theme}.png`);

    await page.keyboard.press('Escape');
    await page.locator('.connector-connect-dialog').waitFor({ state: 'hidden', timeout: 10_000 });

    const detailUrl = `${BASE}/settings/connectors/sftp_fetch/${installationId}`;
    await page.goto(detailUrl, { waitUntil: 'networkidle' });
    await page.locator('.connector-detail-tabs').waitFor({ timeout: 15_000 });
    await shot(page, `${SHA}-connectors-detail-setup-${vp.id}-${theme}.png`);

    await page.goto(`${detailUrl}/sources`, { waitUntil: 'networkidle' });
    await page.locator('.connector-source-scope-picker, .connector-source-tree').first().waitFor({
      timeout: 15_000,
    });
    await shot(page, `${SHA}-connectors-detail-sources-${vp.id}-${theme}.png`);

    await context.close();
  }
}

const browser = await chromium.launch();
const context = await browser.newContext();
await apiLogin(context);
const installationId = await ensureSftpInstallation(context);
await context.close();

for (const theme of ['light', 'dark']) {
  await captureSet(browser, theme, installationId);
}
await browser.close();

console.log(`Wrote connector screenshots to ${OUT}`);
