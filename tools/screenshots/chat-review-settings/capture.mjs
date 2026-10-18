#!/usr/bin/env node
/**
 * Chat (C1–C3), review (P1/P1b), settings (E1/E1b/E2/E10) — 1440 / 1024 / 390, light + dark.
 *
 *   node tools/screenshots/chat-review-settings/seed.mjs
 *   node tools/screenshots/chat-review-settings/capture.mjs
 */
import { chromium } from 'playwright';
import { execFileSync, execSync } from 'node:child_process';
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

const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? 'ordner.demo@fixture.docuvate.test';
const PASSWORD = process.env.SCREENSHOT_USER_PASSWORD ?? 'screenshot-demo-12';
const NAME = process.env.SCREENSHOT_USER_NAME ?? 'Ordner Demo';

const VIEWPORTS = [
  { id: '1440', width: 1440, height: 900 },
  { id: '1024', width: 1024, height: 768 },
  { id: '390', width: 390, height: 844 },
];

const authHeaders = { Origin: ORIGIN, Referer: `${ORIGIN}/` };

try {
  execFileSync(process.execPath, ['tools/screenshots/chat-review-settings/seed.mjs'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      AUTH_BASE: process.env.AUTH_BASE ?? 'http://127.0.0.1:3001/api/auth',
      API_BASE: process.env.API_BASE ?? 'http://127.0.0.1:3001/v1',
      WEB_ORIGIN: ORIGIN,
    },
  });
} catch (err) {
  console.warn('seed skipped or failed (continuing):', err?.message ?? err);
}

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
    window.localStorage.setItem('docuvate.locale', lng);
  }, locale);
  await page.reload({ waitUntil: 'networkidle' });
}

async function capture(page, name, theme) {
  await setTheme(page, theme);
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, `${name}-${theme}.png`), fullPage: true });
}

async function captureAllViewports(page, baseName, setup) {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    if (setup) await setup(page, vp);
    await capture(page, `${baseName}-${vp.id}`, 'light');
    await capture(page, `${baseName}-${vp.id}`, 'dark');
  }
}

const browser = await chromium.launch();
const context = await browser.newContext();
await apiLogin(context);
const page = await context.newPage();

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await setLocale(page, 'de');

await captureAllViewports(page, 'c1-chat', async (p) => {
  await p.goto(`${BASE}/chat`, { waitUntil: 'networkidle' });
  const firstThread = p.locator('.doc-chat-thread-list button').first();
  if (await firstThread.isVisible().catch(() => false)) {
    await firstThread.click();
    await p.waitForTimeout(300);
  }
});

await captureAllViewports(page, 'c2-chat-new', async (p) => {
  await p.route('**/api/v1/chat/threads', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ threads: [] }),
      });
      return;
    }
    await route.continue();
  });
  await p.goto(`${BASE}/chat`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  await p.unroute('**/api/v1/chat/threads');
});

const C3_SETTINGS_BODY = {
  preferredExtractorEngine: 'pipeline',
  preferredChatProvider: null,
  effectiveChatProvider: 'rag-ollama',
  customerChatProvider: 'rag-ollama',
  documentChatUiEnabled: true,
  documentChatAvailable: false,
  documentChatReadiness: 'starting',
  documentChatReadinessReason: 'model_loading',
  documentChatOllamaModel: 'llama3.2',
  documentChatRunsOnCpu: true,
  documentChatLocalModelEnabled: true,
  documentChatLocalModelReady: false,
  advancedFeaturesEnabled: true,
  useArenaWinnerAsDefault: false,
  labelFieldConfidenceThreshold: 0.62,
  fieldExtractionConfidenceGateEnabled: true,
  fieldExtractionRequiredLabelIds: [],
  themePreference: 'system',
  documentChatCloudBaseUrl: null,
  documentChatCloudApiKeyConfigured: false,
};

{
  const c3Context = await browser.newContext();
  await apiLogin(c3Context);
  const c3Page = await c3Context.newPage();
  await c3Page.addInitScript((body) => {
    const payload = JSON.stringify(body);
    const orig = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      const method = init?.method ?? 'GET';
      if (url.includes('/api/v1/settings') && method === 'GET') {
        return Promise.resolve(
          new Response(payload, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      return orig(input, init);
    };
  }, C3_SETTINGS_BODY);
  await c3Page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await setLocale(c3Page, 'de');
  await captureAllViewports(c3Page, 'c3-chat-not-ready', async (p) => {
    await p.goto(`${BASE}/chat`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
  });
  await c3Context.close();
}

await captureAllViewports(page, 'p1-review', async (p) => {
  await p.goto(`${BASE}/review`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
});

await captureAllViewports(page, 'p1b-review-preview-pick', async (p) => {
  await p.goto(`${BASE}/review`, { waitUntil: 'networkidle' });
  const correctBtn = p.getByRole('button', { name: 'Korrigieren' });
  if (await correctBtn.isVisible().catch(() => false)) {
    await correctBtn.click();
    await p.waitForTimeout(300);
  }
});

await captureAllViewports(page, 'e1-settings', async (p) => {
  await p.evaluate(() => {
    window.localStorage.setItem('docuvate.advancedFeatures', 'false');
  });
  await p.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
});

await captureAllViewports(page, 'e1b-settings-advanced', async (p) => {
  await p.evaluate(() => {
    window.localStorage.setItem('docuvate.advancedFeatures', 'true');
  });
  await p.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
});

await captureAllViewports(page, 'e2-settings-savebar', async (p) => {
  await p.evaluate(() => {
    window.localStorage.setItem('docuvate.advancedFeatures', 'true');
  });
  await p.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);
  const urlInput = p.locator('#settings-document-chat input[type="url"]').first();
  if (await urlInput.isVisible().catch(() => false)) {
    await urlInput.fill('https://api.openai.com/v1');
    await urlInput.focus();
  }
  const keyInput = p.locator('#settings-document-chat input[type="password"]').first();
  if (await keyInput.isVisible().catch(() => false)) {
    await keyInput.fill('sk-fixture-key-3f9a');
  }
  await p.waitForTimeout(300);
});

await captureAllViewports(page, 'e10-admin-users', async (p) => {
  await p.goto(`${BASE}/settings/admin/users`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
});

await browser.close();
console.log('Screenshots written to', OUT);
console.log('HEAD_SHA', SHA);
