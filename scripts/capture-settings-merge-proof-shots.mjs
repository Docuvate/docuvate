import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const EXPECT_SHA = execSync('git -C /workspace rev-parse --short HEAD').toString().trim();
const BASE = process.env.DOCUVATE_WEB_URL ?? 'http://127.0.0.1:5174';
const OUT = process.env.OUT_DIR ?? '/opt/cursor/artifacts/settings-merge-proof';
mkdirSync(OUT, { recursive: true });

const email = 'screenshot-user@test.local';
const password = 'TestPass123!';

const MOCK_ENGINES_PARTIAL = {
  engines: [
    {
      id: 'pipeline',
      label: 'Pipeline',
      description: '',
      available: true,
    },
    {
      id: 'tesseract',
      label: 'Tesseract',
      description: '',
      available: false,
    },
  ],
};

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

async function withPage(locale, theme, fn) {
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
  await fn(page);
  await browser.close();
}

async function mockPartialEngines(page) {
  await page.route('**/settings/extraction-engines**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ENGINES_PARTIAL),
    });
  });
}

async function captureProofOptionalEngineOffline(locale, theme, filename) {
  await withPage(locale, theme, async (page) => {
    await mockPartialEngines(page);
    await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const callout = page.locator('.settings-callout--warn');
    if ((await callout.count()) > 0) {
      throw new Error('expected no extraction offline callout when selected engine is available');
    }

    const engineSelect = page.locator('.settings-field .custom-select-trigger').first();
    await engineSelect.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(OUT, filename), fullPage: false });
  });
}

async function captureSettingsTopAndFull(locale, theme, prefix) {
  await withPage(locale, theme, async (page) => {
    await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const title = page.getByRole('heading', { level: 1 });
    await title.waitFor({ state: 'visible' });
    await page.screenshot({
      path: join(OUT, `${prefix}-settings-top-${locale}-${theme}-1440.png`),
      fullPage: false,
    });
    await page.screenshot({
      path: join(OUT, `${prefix}-settings-full-${locale}-${theme}-1440.png`),
      fullPage: true,
    });
  });
}

async function captureBlockedLabels(locale, theme, filename) {
  await withPage(locale, theme, async (page) => {
    await page.goto(`${BASE}/settings/blocked-labels`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(OUT, filename), fullPage: true });
  });
}

async function main() {
  writeFileSync(join(OUT, 'build-sha.txt'), `${EXPECT_SHA}\n`);
  await captureProofOptionalEngineOffline(
    'de',
    'light',
    `proof-extraction-partial-offline-de-light-open-select-${EXPECT_SHA}.png`,
  );
  await captureProofOptionalEngineOffline(
    'en',
    'dark',
    `proof-extraction-partial-offline-en-dark-open-select-${EXPECT_SHA}.png`,
  );
  await captureSettingsTopAndFull('de', 'light', 'layout');
  await captureSettingsTopAndFull('en', 'dark', 'layout');
  await captureBlockedLabels(
    'de',
    'light',
    `layout-blocked-labels-de-light-full-${EXPECT_SHA}.png`,
  );
  console.log('OUT', OUT);
  console.log('SHA', EXPECT_SHA);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
