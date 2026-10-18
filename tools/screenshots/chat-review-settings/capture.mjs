#!/usr/bin/env node
/**
 * Chat (C1–C3), review (P1), settings (E1/E10) — 1440 / 1024 / 390, light + dark.
 *
 *   node tools/screenshots/chat-review-settings/capture.mjs
 */
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT =
  process.env.SCREENSHOT_DIR ??
  path.join(REPO_ROOT, 'docs/screenshots/pr-j');
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const AUTH = `${BASE}/api/auth`;
const API = `${BASE}/api/v1`;
const ORIGIN = new URL(BASE).origin;
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? 'chat-review-screens@fixture.docuvate.test';
const PASSWORD = process.env.SCREENSHOT_USER_PASSWORD ?? 'ChatReviewScreenshot1!';
const NAME = process.env.SCREENSHOT_USER_NAME ?? 'Chat Review Screenshot';

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

async function setTheme(page, theme) {
  await page.evaluate((mode) => {
    document.documentElement.setAttribute('data-docuvate-theme', mode);
  }, theme);
}

async function setLocale(page, locale) {
  await page.evaluate((lng) => {
    window.localStorage.setItem('docuvate.i18n', lng);
  }, locale);
  await page.reload({ waitUntil: 'networkidle' });
}

async function capture(page, name, theme) {
  await setTheme(page, theme);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(OUT, `${name}-${theme}.png`), fullPage: true });
}

const browser = await chromium.launch();
const context = await browser.newContext();
await apiLogin(context);
const page = await context.newPage();

await setLocale(page, 'de');

for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(`${BASE}/chat`, { waitUntil: 'networkidle' });
  await capture(page, `c1-chat-${vp.id}`, 'light');
  await capture(page, `c1-chat-${vp.id}`, 'dark');
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.route('**/api/v1/settings', async (route) => {
  if (route.request().method() !== 'GET') {
    await route.continue();
    return;
  }
  const response = await route.fetch();
  const json = await response.json();
  json.documentChatReadiness = 'starting';
  json.documentChatReadinessReason = 'model_loading';
  json.customerChatProvider = 'rag-ollama';
  await route.fulfill({ response, json });
});
for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(`${BASE}/chat`, { waitUntil: 'networkidle' });
  await capture(page, `c3-chat-not-ready-${vp.id}`, 'light');
  await capture(page, `c3-chat-not-ready-${vp.id}`, 'dark');
}
await page.unroute('**/api/v1/settings');

for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(`${BASE}/review`, { waitUntil: 'networkidle' });
  await capture(page, `p1-review-${vp.id}`, 'light');
  await capture(page, `p1-review-${vp.id}`, 'dark');
}

for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await capture(page, `e1-settings-${vp.id}`, 'light');
  await capture(page, `e1-settings-${vp.id}`, 'dark');
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/settings/admin/users`, { waitUntil: 'networkidle' });
await capture(page, 'e10-admin-users-1440', 'light');
await capture(page, 'e10-admin-users-1440', 'dark');

await browser.close();
console.log('Screenshots written to', OUT);
console.log('HEAD_SHA', SHA);
