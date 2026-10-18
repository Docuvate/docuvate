import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { execSync } from 'child_process';

const EXPECT_SHA = execSync('git -C /workspace rev-parse --short HEAD').toString().trim();
const BASE = process.env.DOCUVATE_WEB_URL ?? 'http://127.0.0.1:5174';
const OUT = '/opt/cursor/artifacts/settings-shots';
mkdirSync(OUT, { recursive: true });

const email = 'screenshot-user@test.local';
const password = 'TestPass123!';

async function login(page) {
  const res = await page.request.post(`${BASE}/api/auth/sign-in/email`, {
    data: { email, password },
  });
  if (!res.ok()) throw new Error(`sign-in failed: ${res.status()}`);
}

async function setTheme(page, mode) {
  await page.locator('.user-account-menu-trigger').click();
  const label = mode === 'dark' ? /Dunkles Design|Dark theme/i : /Helles Design|Light theme/i;
  await page.getByRole('menuitem', { name: label }).click();
  await page.waitForTimeout(400);
}

async function setLocale(page, lang) {
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  const btn = lang === 'de' ? /Deutsch|German/i : /English|Englisch/i;
  await page.getByRole('button', { name: btn }).click();
  await page.waitForTimeout(500);
}

function settingsGridColumns(viewportWidth) {
  const pageMax = 1180;
  const pagePad = 48;
  const contentWidth = Math.min(viewportWidth, pageMax) - pagePad;
  const colMin = 340;
  const gap = 16;
  let cols = 1;
  while (cols * colMin + (cols - 1) * gap <= contentWidth) {
    cols += 1;
  }
  return Math.max(1, cols - 1);
}

async function assertSettingsCardRowHeights(page, viewportWidth) {
  const heights = await page.locator('.settings-grid > .card').evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().height)
  );
  const cols = settingsGridColumns(viewportWidth);
  for (let start = 0; start < heights.length; start += cols) {
    const row = heights.slice(start, start + cols);
    if (row.length <= 1) continue;
    const max = Math.max(...row);
    const min = Math.min(...row);
    if (max - min > 1) {
      throw new Error(
        `settings card row ${start / cols + 1} height mismatch (px): ${row.map((h) => h.toFixed(1)).join(', ')}`
      );
    }
  }
  const account = page.locator('#settings-account');
  const grid = page.locator('.settings-grid');
  const gridBox = await grid.boundingBox();
  const accountBox = await account.boundingBox();
  if (!gridBox || !accountBox) {
    throw new Error('settings grid or account card missing for width assert');
  }
  if (Math.abs(accountBox.width - gridBox.width) > 2) {
    throw new Error(
      `account card width ${accountBox.width.toFixed(1)} != grid ${gridBox.width.toFixed(1)}`
    );
  }
  return { cols, heights, accountWidth: accountBox.width, gridWidth: gridBox.width };
}

async function verifySha(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const sha = await page.evaluate(() => window.__DOCUVATE_BUILD_SHA__ ?? 'missing');
  if (sha !== EXPECT_SHA) {
    throw new Error(`BUILD_SHA mismatch: page=${sha} expected=${EXPECT_SHA}`);
  }
  return sha;
}

async function shotSettings(page, width, locale, theme, name) {
  await setLocale(page, locale);
  await setTheme(page, theme);
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.setViewportSize({ width, height: 900 });
  const rowHeights = await assertSettingsCardRowHeights(page, width);
  const path = `${OUT}/${name}-${width}.png`;
  const mainScroll = await page.locator('.app-main').evaluate((el) => el.scrollHeight);
  const viewportHeight = Math.min(Math.max(mainScroll + 96, 1024), 5000);
  await page.setViewportSize({ width, height: viewportHeight });
  await page.waitForTimeout(300);
  await page.screenshot({ path, fullPage: true });
  return { path, h: mainScroll, viewportHeight, rowHeights };
}

async function deleteDialog(page, locale, theme, outPath) {
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  await setLocale(page, locale);
  await setTheme(page, theme);
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  let firstDoc = page.locator('a[href^="/documents/"]').first();
  if (!(await firstDoc.count())) {
    await page.locator('input[type="file"]').first().setInputFiles('/workspace/experiments/fixtures/sample_two_column.pdf');
    await page.waitForTimeout(12000);
    firstDoc = page.locator('a[href^="/documents/"]').first();
  }
  await firstDoc.click();
  await page.waitForURL(/\/documents\//);
  await page.locator('.document-detail-delete').click();
  await page.locator('dialog.confirm-dialog[open]').waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: outPath });
}

async function main() {
  const browser = await chromium.launch();
  const checks = [];

  for (const width of [1440, 1024]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    await login(page);
    const sha = await verifySha(page);
    console.log('BUILD_SHA verified:', sha);

    for (const [locale, theme, name] of [
      ['de', 'light', 'de-light'],
      ['de', 'dark', 'de-dark'],
      ['en', 'light', 'en-light'],
    ]) {
      const meta = await shotSettings(page, width, locale, theme, name);
      checks.push({ name, width, ...meta });
      console.log('settings', name, width, 'scrollHeight', meta.h);
    }
    await ctx.close();
  }

  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.route('**/api/v1/settings', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const json = await response.json();
    json.documentChatReadiness = 'unavailable';
    json.documentChatReadinessReason = 'model_loading';
    json.customerChatProvider = 'rag-ollama';
    await route.fulfill({ response, json });
  });
  await login(page2);
  await setLocale(page2, 'de');
  await page2.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  const mainScroll = await page2.locator('.app-main').evaluate((el) => el.scrollHeight);
  await page2.setViewportSize({ width: 1440, height: Math.min(mainScroll + 80, 4000) });
  await page2.setViewportSize({
    width: 1440,
    height: Math.min(Math.max(mainScroll + 96, 1024), 5000),
  });
  await page2.waitForTimeout(200);
  await page2.screenshot({ path: `${OUT}/de-light-chat-unavailable-1440.png`, fullPage: true });
  await assertSettingsCardRowHeights(page2, 1440);
  const chatStatus = await page2
    .locator('#settings-document-chat .settings-callout--info p, #settings-document-chat .settings-status-line')
    .first()
    .textContent();
  console.log('chat status (simulated unavailable):', chatStatus?.trim());
  await ctx2.close();

  const page3 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page3);
  await deleteDialog(page3, 'de', 'dark', '/opt/cursor/artifacts/delete-dialog-de-dark.png');
  await deleteDialog(page3, 'en', 'light', '/opt/cursor/artifacts/delete-dialog-en-light.png');
  await browser.close();

  console.log('EXPECTED_SHA', EXPECT_SHA);
  console.log('CHECKS', JSON.stringify(checks));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
