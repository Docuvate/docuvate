#!/usr/bin/env node
// Minimal PR artifacts: 1440 light + 390 for labels, global chat, login locale segment.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:4173';
const OUT = process.env.SCREENSHOT_DIR ?? '.artifacts/audit-fix-shots';
const EMAIL = process.env.E2E_SMOKE_EMAIL ?? 'alex.upload@fixture.docuvate.test';
const PASSWORD = process.env.E2E_SMOKE_PASSWORD ?? 'E2eSmokeFixture1!';

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password|passwort/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|anmelden/i }).click();
  await page.waitForURL(/\/(documents|inbox)?/, { timeout: 60_000 });
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const vp of [
    { tag: '1440', width: 1440, height: 900 },
    { tag: '390', width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await login(page);
    await page.goto(`${BASE}/structure/labels`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await shot(page, `labels-${vp.tag}-light.png`);
    await page.goto(`${BASE}/chat`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await shot(page, `global-chat-${vp.tag}-light.png`);
    await page.close();
  }
  await browser.close();
  console.log('wrote', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
