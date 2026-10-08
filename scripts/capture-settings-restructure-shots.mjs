import { chromium } from 'playwright';
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const EXPECT_SHA = execSync('git -C /workspace rev-parse --short HEAD').toString().trim();
const BASE = process.env.DOCUVATE_WEB_URL ?? 'http://127.0.0.1:5174';
const OUT = '/opt/cursor/artifacts/settings-restructure-shots';
mkdirSync(OUT, { recursive: true });

const email = 'screenshot-user@test.local';
const password = 'TestPass123!';
const LOCALE_KEY = 'docuvate.locale';
const THEME_KEY = 'docuvate-theme';

const SETTINGS_TAB_PATHS = [
  { path: '/settings', shot: 'settings-tab-overview-de-light-1440.png' },
  { path: '/settings/connectors', shot: 'settings-tab-connectors-de-light-1440.png' },
  { path: '/settings/blocked-labels', shot: 'settings-tab-blocked-labels-de-light-1440.png' },
];

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

async function verifySha(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const sha = await page.evaluate(() => window.__DOCUVATE_BUILD_SHA__ ?? 'missing');
  if (sha !== EXPECT_SHA) {
    throw new Error(`BUILD_SHA mismatch: page=${sha} expected=${EXPECT_SHA}`);
  }
}

async function assertLocale(page, expected) {
  const lang = await page.evaluate(() => document.documentElement.lang || '');
  const active = await page.locator('.locale-switcher-btn.active').first().textContent();
  if (expected === 'de' && !lang.startsWith('de') && !/Deutsch/i.test(active ?? '')) {
    throw new Error(`expected de locale, got lang=${lang} active=${active}`);
  }
  if (expected === 'en' && !lang.startsWith('en') && !/English/i.test(active ?? '')) {
    throw new Error(`expected en locale, got lang=${lang} active=${active}`);
  }
}

async function assertTheme(page, expected) {
  const theme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-docuvate-theme')
  );
  if (theme !== expected) {
    throw new Error(`expected theme ${expected}, got ${theme}`);
  }
}

async function ensureLocale(page, locale) {
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [LOCALE_KEY, locale]
  );
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
}

async function setTheme(page, mode) {
  await page.locator('.user-account-menu-trigger').click();
  const label = mode === 'dark' ? /Dunkles Design|Dark theme/i : /Helles Design|Light theme/i;
  await page.getByRole('menuitem', { name: label }).click();
  await page.waitForTimeout(400);
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [THEME_KEY, mode]
  );
}

async function fullMainShot(page, path) {
  const mainScroll = await page.locator('.app-main').evaluate((el) => el.scrollHeight);
  const topbar = await page.locator('.app-topbar').boundingBox();
  const height = Math.min(Math.max((topbar?.height ?? 56) + mainScroll + 8, 900), 5000);
  const width = page.viewportSize()?.width ?? 1440;
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(250);
  await page.screenshot({ path, fullPage: false });
}

async function seedBlockedLabels(page, phrases) {
  for (const phrase of phrases) {
    const res = await page.request.post(`${BASE}/api/v1/labels/recommendation-blocklist`, {
      data: { phrase },
    });
    if (!res.ok() && res.status() !== 409) {
      throw new Error(`seed blocklist failed for ${phrase}: ${res.status()}`);
    }
  }
}

async function clearBlockedLabels(page) {
  const res = await page.request.get(`${BASE}/api/v1/labels/recommendation-blocklist`);
  if (!res.ok()) return;
  const json = await res.json();
  for (const item of json.items ?? []) {
    await page.request.delete(`${BASE}/api/v1/labels/recommendation-blocklist/${item.id}`);
  }
}

async function tabsTop(page) {
  const box = await page.locator('.settings-section-tabs').boundingBox();
  if (!box) throw new Error('settings tabs not found');
  return box.y;
}

async function assertSettingsTabsStable(page) {
  const tops = [];
  for (const { path } of SETTINGS_TAB_PATHS) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    tops.push(await tabsTop(page));
  }
  const min = Math.min(...tops);
  const max = Math.max(...tops);
  if (max - min > 1) {
    throw new Error(`settings tab bar shifted: tops=${tops.join(', ')}`);
  }
}

async function assertBlockedLabelsAddRowAligned(page) {
  const input = page.locator('.blocked-labels-add-row .input');
  const button = page.locator('.blocked-labels-add-row .btn');
  await input.waitFor({ state: 'visible' });
  const inputBox = await input.boundingBox();
  const btnBox = await button.boundingBox();
  if (!inputBox || !btnBox) {
    throw new Error('blocked labels add row: missing bounding box');
  }
  if (Math.abs(inputBox.y - btnBox.y) > 1 || Math.abs(inputBox.height - btnBox.height) > 1) {
    throw new Error(
      `add row misaligned: input y=${inputBox.y} h=${inputBox.height} btn y=${btnBox.y} h=${btnBox.height}`
    );
  }
}

async function mockConnectorsNonAdmin(page) {
  await page.route('**/connectors/catalog', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.viewerIsServerAdmin = false;
    await route.fulfill({
      status: response.status(),
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

async function collectConnectorsGeometry(page) {
  return page.evaluate(() => {
    const search = document.querySelector('.connector-catalog-search');
    const chip = document.querySelector('.connector-category-chip');
    const btn = document.querySelector('.connector-catalog-actions .btn');
    const grid = document.querySelector('.connector-catalog-grid');
    const cards = [...document.querySelectorAll('.connector-catalog-card')];
    const box = (el) => (el ? el.getBoundingClientRect() : null);
    const sr = box(search);
    const cr = box(chip);
    const br = box(btn);
    const widths = cards.map((c) => box(c)?.width ?? 0).filter((w) => w > 0);
    const gridRect = box(grid);
    const firstCard = cards[0] ? box(cards[0]) : null;
    let columnsAt1440 = null;
    if (grid && gridRect && firstCard) {
      const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
      columnsAt1440 = Math.max(1, Math.round((gridRect.width + gap) / (firstCard.width + gap)));
    }
    const descGaps = cards
      .map((card) => {
        const desc = card.querySelector('.connector-catalog-description');
        const footer = card.querySelector('.connector-catalog-card-footer');
        if (!desc || !footer) return null;
        return footer.getBoundingClientRect().top - desc.getBoundingClientRect().bottom;
      })
      .filter((g) => g != null);
    return {
      searchHeight: sr?.height ?? null,
      chipHeight: cr?.height ?? null,
      buttonHeight: br?.height ?? null,
      minCardWidth: widths.length ? Math.min(...widths) : null,
      columnsAt1440,
      descToDividerGap: descGaps.length ? Math.min(...descGaps) : null,
    };
  });
}

async function assertConnectorsGeometry(page, { expectThreeColumns = false } = {}) {
  const g = await collectConnectorsGeometry(page);
  const heights = [g.searchHeight, g.chipHeight, g.buttonHeight].filter((h) => h != null);
  if (heights.length < 3) {
    throw new Error(`connectors geometry incomplete: ${JSON.stringify(g)}`);
  }
  const h0 = heights[0];
  for (const h of heights) {
    if (Math.abs(h - h0) > 1) {
      throw new Error(`connectors height mismatch: ${JSON.stringify(g)}`);
    }
  }
  if (g.minCardWidth != null && g.minCardWidth < 300) {
    throw new Error(`connector card too narrow: min=${g.minCardWidth}`);
  }
  if (expectThreeColumns && g.columnsAt1440 !== 3) {
    throw new Error(`expected 3 connector columns at 1440: ${JSON.stringify(g)}`);
  }
  if (g.descToDividerGap != null && g.descToDividerGap < 11.5) {
    throw new Error(`description to divider gap too small: ${JSON.stringify(g)}`);
  }
  return g;
}

async function shotConnectorsPage(page, path, filename, { openAdminDetails = false, expectThreeColumns = false } = {}) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  if (openAdminDetails) {
    const details = page.locator('.connector-oauth-admin-details').first();
    if (await details.count()) {
      await details.evaluate((el) => {
        el.open = true;
      });
      await page.waitForTimeout(200);
    }
  }
  await assertConnectorsGeometry(page, { expectThreeColumns });
  await fullMainShot(page, `${OUT}/${filename}`);
}

async function shotConnectorsMailFilter(page, filename, { expectThreeColumns = false } = {}) {
  await page.goto(`${BASE}/settings/connectors`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /E-Mail/i }).click();
  await page.waitForTimeout(250);
  await assertConnectorsGeometry(page, { expectThreeColumns });
  await fullMainShot(page, `${OUT}/${filename}`);
}

async function assertToastDoesNotShiftCard(page) {
  await page.goto(`${BASE}/settings/blocked-labels`, { waitUntil: 'networkidle' });
  const card = page.locator('.blocked-labels-panel');
  await card.waitFor({ state: 'visible' });
  const before = await card.boundingBox();
  if (!before) throw new Error('card box missing before toast');
  await page.getByRole('button', { name: /Wieder zulassen|Allow again/i }).first().click();
  await page.locator('.toast').waitFor({ state: 'visible' });
  const after = await card.boundingBox();
  if (!after) throw new Error('card box missing after toast');
  if (Math.abs(before.y - after.y) > 1) {
    throw new Error(`toast shifted card: before.y=${before.y} after.y=${after.y}`);
  }
}

function contextOptions(width, locale) {
  return {
    viewport: { width, height: 900 },
    locale: locale === 'de' ? 'de-DE' : 'en-US',
    timezoneId: 'Europe/Berlin',
  };
}

async function newPreparedContext(browser, width, locale, theme) {
  const ctx = await browser.newContext(contextOptions(width, locale));
  await ctx.addInitScript(
    ([localeKey, localeValue, themeKey, themeValue]) => {
      localStorage.setItem(localeKey, localeValue);
      localStorage.setItem(themeKey, themeValue);
    },
    [LOCALE_KEY, locale, THEME_KEY, theme]
  );
  return ctx;
}

function clearOutDirPngs() {
  for (const name of readdirSync(OUT)) {
    if (name.endsWith('.png')) {
      unlinkSync(join(OUT, name));
    }
  }
}

async function main() {
  clearOutDirPngs();

  const browserDe = await chromium.launch({ args: ['--lang=de-DE'] });
  const browserEn = await chromium.launch({ args: ['--lang=en-US'] });

  const ctxDe = await newPreparedContext(browserDe, 1440, 'de', 'light');
  const pageDe = await ctxDe.newPage();
  await login(pageDe);
  await verifySha(pageDe);
  await ensureLocale(pageDe, 'de');
  await assertSettingsTabsStable(pageDe);
  await seedBlockedLabels(pageDe, ['PDF-XChange', 'Newsletter', 'Rechnungskorrektur']);

  await pageDe.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await assertLocale(pageDe, 'de');
  await assertTheme(pageDe, 'light');
  await fullMainShot(pageDe, `${OUT}/settings-overview-de-light-1440.png`);

  for (const { path, shot } of SETTINGS_TAB_PATHS) {
    await pageDe.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await fullMainShot(pageDe, `${OUT}/${shot}`);
  }

  await pageDe.goto(`${BASE}/settings/blocked-labels`, { waitUntil: 'networkidle' });
  await assertBlockedLabelsAddRowAligned(pageDe);
  await fullMainShot(pageDe, `${OUT}/blocked-labels-de-light-1440-with-items.png`);

  await assertToastDoesNotShiftCard(pageDe);
  await fullMainShot(pageDe, `${OUT}/blocked-labels-de-light-1440-undo-toast.png`);
  await pageDe.locator('.toast').screenshot({ path: `${OUT}/toast-undo-closeup-de-light.png` });

  await clearBlockedLabels(pageDe);
  await pageDe.goto(`${BASE}/settings/blocked-labels`, { waitUntil: 'networkidle' });
  await pageDe.locator('.blocked-labels-empty').waitFor({ state: 'visible' });
  await fullMainShot(pageDe, `${OUT}/blocked-labels-de-light-1440-empty.png`);

  await shotConnectorsPage(
    pageDe,
    '/settings/connectors',
    'connectors-de-light-1440-admin.png',
    { openAdminDetails: true, expectThreeColumns: true }
  );
  await shotConnectorsMailFilter(pageDe, 'connectors-de-light-1440-filter-mail.png', {
    expectThreeColumns: false,
  });

  const ctxDeUser = await newPreparedContext(browserDe, 1440, 'de', 'light');
  const pageDeUser = await ctxDeUser.newPage();
  await login(pageDeUser);
  await pageDeUser.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await ensureLocale(pageDeUser, 'de');
  await mockConnectorsNonAdmin(pageDeUser);
  await shotConnectorsPage(pageDeUser, '/settings/connectors', 'connectors-de-light-1440-user.png', {
    expectThreeColumns: true,
  });
  await ctxDeUser.close();

  const ctxDe1024Admin = await newPreparedContext(browserDe, 1024, 'de', 'light');
  const pageDe1024Admin = await ctxDe1024Admin.newPage();
  await login(pageDe1024Admin);
  await pageDe1024Admin.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await ensureLocale(pageDe1024Admin, 'de');
  await shotConnectorsPage(
    pageDe1024Admin,
    '/settings/connectors',
    'connectors-de-light-1024-admin.png',
    { openAdminDetails: true }
  );
  await ctxDe1024Admin.close();

  const ctxDe1024User = await newPreparedContext(browserDe, 1024, 'de', 'light');
  const pageDe1024User = await ctxDe1024User.newPage();
  await login(pageDe1024User);
  await pageDe1024User.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await ensureLocale(pageDe1024User, 'de');
  await mockConnectorsNonAdmin(pageDe1024User);
  await shotConnectorsPage(pageDe1024User, '/settings/connectors', 'connectors-de-light-1024-user.png');
  await ctxDe1024User.close();

  const connectorsGeometry = await collectConnectorsGeometry(pageDe);
  if (connectorsGeometry.columnsAt1440 !== 3) {
    throw new Error(`geometry columnsAt1440 expected 3: ${JSON.stringify(connectorsGeometry)}`);
  }
  writeFileSync(`${OUT}/geometry.json`, `${JSON.stringify({ sha: EXPECT_SHA, connectors: connectorsGeometry }, null, 2)}\n`);

  await ctxDe.close();

  const ctxDe1024Items = await newPreparedContext(browserDe, 1024, 'de', 'light');
  const pageDe1024Items = await ctxDe1024Items.newPage();
  await login(pageDe1024Items);
  await seedBlockedLabels(pageDe1024Items, ['PDF-XChange', 'Newsletter', 'Rechnungskorrektur']);
  await pageDe1024Items.goto(`${BASE}/settings/blocked-labels`, { waitUntil: 'networkidle' });
  await ensureLocale(pageDe1024Items, 'de');
  await fullMainShot(pageDe1024Items, `${OUT}/blocked-labels-de-light-1024-with-items.png`);
  await ctxDe1024Items.close();

  const ctxDe1024Empty = await newPreparedContext(browserDe, 1024, 'de', 'light');
  const pageDe1024Empty = await ctxDe1024Empty.newPage();
  await login(pageDe1024Empty);
  await clearBlockedLabels(pageDe1024Empty);
  await pageDe1024Empty.goto(`${BASE}/settings/blocked-labels`, { waitUntil: 'networkidle' });
  await ensureLocale(pageDe1024Empty, 'de');
  await pageDe1024Empty.locator('.blocked-labels-empty').waitFor({ state: 'visible' });
  await fullMainShot(pageDe1024Empty, `${OUT}/blocked-labels-de-light-1024-empty.png`);
  await ctxDe1024Empty.close();

  await browserDe.close();

  const ctxEnOverview = await newPreparedContext(browserEn, 1440, 'en', 'dark');
  const pageEnOverview = await ctxEnOverview.newPage();
  await login(pageEnOverview);
  await pageEnOverview.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await ensureLocale(pageEnOverview, 'en');
  await setTheme(pageEnOverview, 'dark');
  await pageEnOverview.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await assertLocale(pageEnOverview, 'en');
  await assertTheme(pageEnOverview, 'dark');
  await fullMainShot(pageEnOverview, `${OUT}/settings-overview-en-dark-1440.png`);
  await ctxEnOverview.close();

  const ctxEn = await newPreparedContext(browserEn, 1440, 'en', 'dark');
  const pageEn = await ctxEn.newPage();
  await login(pageEn);
  await pageEn.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await ensureLocale(pageEn, 'en');
  await seedBlockedLabels(pageEn, ['PDF-XChange', 'Newsletter', 'Rechnungskorrektur']);
  await setTheme(pageEn, 'dark');
  await pageEn.goto(`${BASE}/settings/blocked-labels`, { waitUntil: 'networkidle' });
  await assertLocale(pageEn, 'en');
  await assertTheme(pageEn, 'dark');
  await fullMainShot(pageEn, `${OUT}/blocked-labels-en-dark-1440-with-items.png`);
  await shotConnectorsPage(pageEn, '/settings/connectors', 'connectors-en-dark-1440.png');

  await clearBlockedLabels(pageEn);
  await pageEn.goto(`${BASE}/settings/blocked-labels`, { waitUntil: 'networkidle' });
  await pageEn.locator('.blocked-labels-empty').waitFor({ state: 'visible' });
  await fullMainShot(pageEn, `${OUT}/blocked-labels-en-dark-1440-empty.png`);
  await ctxEn.close();

  const ctxRf = await newPreparedContext(browserEn, 1440, 'de', 'light');
  const pageRf = await ctxRf.newPage();
  await login(pageRf);
  await pageRf.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await ensureLocale(pageRf, 'de');
  await pageRf.goto(`${BASE}/structure/recognized-fields`, { waitUntil: 'networkidle' });
  await assertLocale(pageRf, 'de');
  await assertTheme(pageRf, 'light');
  await pageRf.locator('.recognized-fields-defaults-panel').evaluate((el) => el.setAttribute('open', ''));
  await pageRf.waitForTimeout(300);
  await fullMainShot(pageRf, `${OUT}/recognized-fields-de-light-1440-defaults-open.png`);
  await ctxRf.close();

  await browserEn.close();
  console.log('EXPECTED_SHA', EXPECT_SHA);
  console.log('OUT', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
