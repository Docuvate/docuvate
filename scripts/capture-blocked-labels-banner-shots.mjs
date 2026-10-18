import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const SHA = execSync('git -C /workspace rev-parse --short HEAD').toString().trim();
const BASE = process.env.DOCUVATE_WEB_URL ?? 'http://127.0.0.1:5174';
const OUT = process.env.OUT_DIR ?? '/opt/cursor/artifacts/settings-merge-proof';
const email = 'screenshot-user@test.local';
const password = 'TestPass123!';

const PHRASES = ['Rechnung Muster', 'Vertrag Alt', 'Steuer 2024'];

mkdirSync(OUT, { recursive: true });

async function login(page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const res = await page.request.post(`${BASE}/api/auth/sign-in/email`, {
      data: { email, password },
    });
    if (res.ok()) return;
    if (res.status() === 429 && attempt < 7) {
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
      continue;
    }
    throw new Error(`sign-in failed: ${res.status()}`);
  }
}

async function seedBlocklist(page) {
  const list = await page.request.get(`${BASE}/api/v1/labels/recommendation-blocklist`);
  if (!list.ok()) throw new Error(`list blocklist ${list.status()}`);
  const data = await list.json();
  for (const item of data.items ?? []) {
    await page.request.delete(`${BASE}/api/v1/labels/recommendation-blocklist/${item.id}`);
  }
  for (const phrase of PHRASES) {
    const res = await page.request.post(`${BASE}/api/v1/labels/recommendation-blocklist`, {
      data: { phrase },
    });
    if (!res.ok()) throw new Error(`add ${phrase}: ${res.status()}`);
  }
}

async function captureLocale(locale, theme) {
  const tag = locale === 'de' ? 'de-light' : 'en-dark';
  const browser = await chromium.launch({
    args: locale === 'de' ? ['--lang=de-DE'] : ['--lang=en-US'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme === 'dark' ? 'dark' : 'light',
    deviceScaleFactor: 1,
  });
  await context.addInitScript(
    ([loc, th]) => {
      localStorage.setItem('docuvate.locale', loc);
      localStorage.setItem('docuvate-theme', th);
    },
    [locale, theme],
  );
  const page = await context.newPage();
  await login(page);
  await seedBlocklist(page);
  await page.goto(`${BASE}/settings/blocked-labels`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  await page.screenshot({
    path: join(OUT, `blocked-labels-list-3-${tag}-${SHA}.png`),
    fullPage: true,
  });

  const panel = page.locator('.blocked-labels-panel');
  const slot = page.locator('.blocked-labels-undo-slot');
  await slot.waitFor({ state: 'visible' });

  const clipRegion = async () => {
    const slotBox = await slot.boundingBox();
    const panelBox = await panel.boundingBox();
    if (!slotBox || !panelBox) throw new Error('missing layout boxes');
    return {
      x: Math.min(slotBox.x, panelBox.x),
      y: slotBox.y,
      width: Math.max(slotBox.width, panelBox.width),
      height: panelBox.y + panelBox.height - slotBox.y,
    };
  };

  const beforeClip = await clipRegion();
  await page.screenshot({
    path: join(OUT, `blocked-labels-allow-before-${tag}-${SHA}.png`),
    clip: beforeClip,
  });

  const allowLabel =
    locale === 'de' ? /Wieder zulassen/i : /Allow again/i;
  await page.getByRole('button', { name: allowLabel }).first().click();
  await page.locator('.blocked-labels-undo').waitFor({ state: 'visible' });
  await page.waitForTimeout(200);

  const afterClip = await clipRegion();
  await page.screenshot({
    path: join(OUT, `blocked-labels-allow-after-${tag}-${SHA}.png`),
    clip: afterClip,
  });

  await browser.close();

  const browser2x = await chromium.launch({
    args: locale === 'de' ? ['--lang=de-DE'] : ['--lang=en-US'],
  });
  const ctx2 = await browser2x.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme === 'dark' ? 'dark' : 'light',
    deviceScaleFactor: 2,
  });
  await ctx2.addInitScript(
    ([loc, th]) => {
      localStorage.setItem('docuvate.locale', loc);
      localStorage.setItem('docuvate-theme', th);
    },
    [locale, theme],
  );
  const page2 = await ctx2.newPage();
  await login(page2);
  await seedBlocklist(page2);
  await page2.goto(`${BASE}/settings/blocked-labels`, { waitUntil: 'networkidle' });
  await page2.getByRole('button', { name: allowLabel }).first().click();
  await page2.locator('.blocked-labels-undo').waitFor({ state: 'visible' });
  const undo = page2.locator('.blocked-labels-undo');
  await undo.screenshot({
    path: join(OUT, `blocked-labels-undo-banner-2x-${tag}-${SHA}.png`),
  });
  await browser2x.close();
}

async function main() {
  await captureLocale('de', 'light');
  await captureLocale('en', 'dark');
  console.log('OUT', OUT);
  console.log('SHA', SHA);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
