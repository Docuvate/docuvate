import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = process.env.DOCUVATE_WEB_URL ?? 'http://127.0.0.1:5174';
const OUT = process.env.OUT_DIR ?? '/opt/cursor/artifacts/settings-callout-fix';
const PREFIX = process.env.SHOT_PREFIX ?? 'after';
const email = 'screenshot-user@test.local';
const password = 'TestPass123!';

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

async function capture(locale, theme, filename) {
  const browser = await chromium.launch({
    args: locale === 'de' ? ['--lang=de-DE'] : ['--lang=en-US'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme === 'dark' ? 'dark' : 'light',
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
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await page.locator('.settings-grid').scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(OUT, filename), fullPage: true });
  await browser.close();
}

async function main() {
  await capture('de', 'light', `${PREFIX}-settings-callout-de-light-1440.png`);
  await capture('en', 'dark', `${PREFIX}-settings-callout-en-dark-1440.png`);
  console.log('OUT', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
