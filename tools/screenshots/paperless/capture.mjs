#!/usr/bin/env node
/**
 * Paperless connector setup screenshots (German, light/dark, 1280 + 390).
 *
 * Requires: web dev server, Docuvate API, tools/paperless-test stack.
 *
 *   node tools/screenshots/paperless/capture.mjs
 *
 * Env:
 *   SCREENSHOT_DIR — output directory (default: artifacts/screenshots/paperless)
 *   SCREENSHOT_BASE_URL — web origin (default: http://localhost:5173)
 *   PAPERLESS_TEST_URL — Paperless on host (default: http://localhost:18080)
 *   PAPERLESS_API_URL — base_url stored for the connector (API container → Paperless)
 *   DOCKER_BIN — optional docker binary (default: docker)
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = process.env.SCREENSHOT_DIR ?? path.join(REPO_ROOT, 'artifacts/screenshots/paperless');
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001';
const API = `${BASE}/api/v1`;
const ORIGIN = new URL(BASE).origin;

const PAPERLESS_HOST_URL = (process.env.PAPERLESS_TEST_URL ?? 'http://127.0.0.1:18080').replace(
  /\/$/,
  ''
);

const PAPERLESS_API_URL = (process.env.PAPERLESS_API_URL ?? '').replace(/\/$/, '');
if (!PAPERLESS_API_URL) {
  throw new Error('Set PAPERLESS_API_URL to the Paperless base URL reachable from the API container.');
}
const PAPERLESS_DISPLAY_URL = (process.env.PAPERLESS_SCREENSHOT_BASE_URL ?? PAPERLESS_HOST_URL).replace(
  /\/$/,
  ''
);
const COMPOSE_FILE = path.join(REPO_ROOT, 'tools/paperless-test/docker-compose.paperless-test.yml');

const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? 'paperless-screenshots@fixture.docuvate.test';
const PASSWORD = process.env.SCREENSHOT_USER_PASSWORD ?? 'PaperlessScreenshot1!';
const NAME = process.env.SCREENSHOT_USER_NAME ?? 'Paperless Screenshot';

const authHeaders = { Origin: ORIGIN, Referer: `${ORIGIN}/` };

function dockerArgv() {
  const bin = process.env.DOCKER_BIN?.trim();
  return bin ? bin.split(/\s+/) : ['docker'];
}

function parseSetCookieHeader(setCookie) {
  if (!setCookie) return null;
  const first = setCookie.split(/,(?=\s*[^;]+=)/)[0];
  const [pair] = first.split(';');
  const eq = pair.indexOf('=');
  if (eq <= 0) return null;
  return { name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim() };
}

async function obtainPaperlessToken() {
  const username = process.env.PAPERLESS_TEST_USER ?? 'docuvate-test';
  const password = process.env.PAPERLESS_TEST_PASSWORD ?? 'docuvate-test-secret';
  const response = await fetch(`${PAPERLESS_HOST_URL}/api/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(`Paperless token failed: ${response.status}`);
  }
  const body = await response.json();
  const token = body.token?.trim();
  if (!token) throw new Error('Paperless token missing');
  return token;
}

function ensurePaperlessStack() {
  if (process.env.PAPERLESS_TEST_SKIP_COMPOSE === '1') {
    return;
  }
  const composeFile = path.join(REPO_ROOT, 'tools/paperless-test/docker-compose.paperless-test.yml');
  execFileSync(dockerArgv()[0], [...dockerArgv().slice(1), 'compose', '-f', composeFile, 'up', '-d'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    timeout: 600_000,
  });
  execFileSync('node', [path.join(REPO_ROOT, 'tools/paperless-test/seed.mjs')], {
    cwd: REPO_ROOT,
    env: { ...process.env, PAPERLESS_TEST_URL: PAPERLESS_HOST_URL },
    timeout: 600_000,
  });
}

async function scrollMainTo(y) {
  await page.evaluate((scrollY) => {
    const main = document.querySelector('.app-main');
    if (main) {
      main.scrollTop = scrollY;
    } else {
      window.scrollTo(0, scrollY);
    }
  }, y);
}

async function setTheme(theme) {
  await page.evaluate((mode) => {
    document.documentElement.setAttribute('data-docuvate-theme', mode);
    localStorage.setItem('docuvate-theme-preference', mode);
    localStorage.setItem('docuvate-theme', mode);
    localStorage.setItem('docuvate.locale', 'de');
  }, theme);
}

async function captureViewport(name) {
  const file = path.join(OUT, name);
  await page.waitForTimeout(350);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

function seedScreenshotUser() {
  execFileSync('node', [path.join(REPO_ROOT, 'scripts/seed-e2e-smoke-user.mjs')], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      E2E_SMOKE_EMAIL: EMAIL,
      E2E_SMOKE_PASSWORD: PASSWORD,
      E2E_SMOKE_NAME: NAME,
      AUTH_BASE,
      WEB_ORIGIN: ORIGIN,
    },
    stdio: 'inherit',
  });
}

await mkdir(OUT, { recursive: true });
ensurePaperlessStack();
seedScreenshotUser();
const paperlessToken = await obtainPaperlessToken();

const browser = await chromium.launch();
const context = await browser.newContext({ locale: 'de-DE' });
const page = await context.newPage();

async function apiLogin() {
  let signIn = await fetch(`${AUTH_BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!signIn.ok) {
    throw new Error(`sign-in failed: ${signIn.status}`);
  }
  const setCookie = signIn.headers.getSetCookie?.() ?? [];
  const cookies = setCookie.map((line) => {
    const [pair] = line.split(';');
    const eq = pair.indexOf('=');
    return {
      name: pair.slice(0, eq),
      value: pair.slice(eq + 1),
      url: BASE,
      httpOnly: line.toLowerCase().includes('httponly'),
      sameSite: 'Lax',
    };
  });
  await context.addCookies(cookies);
}

async function ensureInstallation() {
  const list = await context.request.get(`${API}/connectors/installations`);
  if (!list.ok()) throw new Error(`list installations ${list.status()}`);
  const body = await list.json();
  const rows = body.installations ?? body.items ?? [];
  let row = rows.find((r) => r.pluginId === 'paperless');
  if (!row?.id) {
    const create = await context.request.post(`${API}/connectors/installations`, {
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      data: {
        pluginId: 'paperless',
        displayName: 'Demo Paperless Archiv',
        credentials: {
          base_url: PAPERLESS_API_URL,
          api_token: paperlessToken,
        },
      },
    });
    if (!create.ok()) {
      throw new Error(`create installation ${create.status()}: ${(await create.text()).slice(0, 200)}`);
    }
    const created = await create.json();
    row = { id: created.id };
  }
  const settingsBody = {
    displayName: 'Demo Paperless Archiv',
    credentials: {
      base_url: PAPERLESS_API_URL,
      api_token: paperlessToken,
    },
  };
  const put = await context.request.put(`${API}/connectors/installations/${row.id}/paperless`, {
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    data: settingsBody,
  });
  if (!put.ok()) {
    const detail = (await put.text()).slice(0, 300);
    const probe = await context.request.get(`${API}/connectors/installations/${row.id}/paperless`);
    if (!probe.ok()) {
      throw new Error(`paperless settings ${put.status()}: ${detail}`);
    }
  }
  return row.id;
}

async function startImport(installationId) {
  const res = await context.request.post(
    `${API}/connectors/installations/${installationId}/paperless/import`,
    { headers: authHeaders }
  );
  if (!res.ok()) {
    throw new Error(`import start ${res.status()}: ${(await res.text()).slice(0, 200)}`);
  }
  const body = await res.json();
  return body.run?.id;
}

async function waitForRun(installationId, runId, timeoutMs = 900_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await context.request.get(
      `${API}/connectors/installations/${installationId}/paperless/import-runs/${runId}`
    );
    if (!res.ok()) {
      throw new Error(`run poll ${res.status()}`);
    }
    const body = await res.json();
    const status = body.run?.status;
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      return body;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error('import run timed out');
}

await apiLogin();
const installationId = await ensureInstallation();

const setupUrl = `${BASE}/settings/connectors/paperless/${installationId}`;
const written = [];
let runId = null;

if (process.env.PAPERLESS_SCREENSHOT_ERROR_ONLY === '1') {
  await captureRunErrorSet();
  await browser.close();
  console.log(JSON.stringify({ outDir: OUT, displayBaseUrl: PAPERLESS_DISPLAY_URL, files: written }, null, 2));
  process.exit(0);
}

for (const theme of ['light', 'dark']) {
  for (const width of [1280, 390]) {
    const tag = `de-${theme}-${width}`;
    await page.setViewportSize({ width, height: width === 390 ? 1400 : 1000 });
    await page.goto(setupUrl, { waitUntil: 'networkidle' });
    await page.waitForSelector('.paperless-connector-setup', { timeout: 60_000 });
    await setTheme(theme);

    await scrollMainTo(0);
    written.push(await captureViewport(`${tag}-01-connection.png`));

    await page.getByRole('button', { name: /Import-Vorschau/i }).click();
    await page.waitForSelector('.paperless-dry-run-summary', { timeout: 120_000 });
    await scrollMainTo(600);
    written.push(await captureViewport(`${tag}-02-dry-run.png`));

    if (!runId) {
      runId = await startImport(installationId);
    }
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.paperless-connector-setup', { timeout: 60_000 });
    await setTheme(theme);
    await scrollMainTo(1600);
    written.push(await captureViewport(`${tag}-03-run-progress.png`));
  }
}

if (!runId) {
  runId = await startImport(installationId);
}
await waitForRun(installationId, runId);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.paperless-connector-setup', { timeout: 60_000 });
await setTheme('light');
await page.setViewportSize({ width: 1280, height: 1000 });
await scrollMainTo(1800);
written.push(await captureViewport('de-light-1280-04-run-completed.png'));

function pausePaperlessStack() {
  execFileSync(
    dockerArgv()[0],
    [...dockerArgv().slice(1), 'compose', '-f', COMPOSE_FILE, 'stop', 'paperless-test-web'],
    { cwd: REPO_ROOT, stdio: 'inherit', timeout: 120_000 }
  );
}

async function resumePaperlessStack() {
  execFileSync(
    dockerArgv()[0],
    [...dockerArgv().slice(1), 'compose', '-f', COMPOSE_FILE, 'start', 'paperless-test-web'],
    { cwd: REPO_ROOT, stdio: 'inherit', timeout: 120_000 }
  );
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await obtainPaperlessToken();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Paperless did not become ready after resume');
}

async function captureRunErrorSet() {
  pausePaperlessStack();
  const badImport = await context.request.post(
    `${API}/connectors/installations/${installationId}/paperless/import`,
    { headers: authHeaders }
  );
  if (!badImport.ok()) {
    await resumePaperlessStack();
    throw new Error(`bad import ${badImport.status()}`);
  }
  const badRunId = (await badImport.json()).run?.id;
  if (badRunId) {
    await waitForRun(installationId, badRunId, 120_000);
  }
  await resumePaperlessStack();
  for (const theme of ['light', 'dark']) {
    for (const width of [1280, 390]) {
      const tag = `de-${theme}-${width}`;
      await page.setViewportSize({ width, height: width === 390 ? 1400 : 1000 });
      await page.goto(setupUrl, { waitUntil: 'networkidle' });
      await page.waitForSelector('.paperless-connector-setup', { timeout: 60_000 });
      await setTheme(theme);
      await scrollMainTo(2000);
      written.push(await captureViewport(`${tag}-05-run-error.png`));
    }
  }
}

await captureRunErrorSet();

await browser.close();
console.log(JSON.stringify({ outDir: OUT, displayBaseUrl: PAPERLESS_DISPLAY_URL, files: written }, null, 2));
