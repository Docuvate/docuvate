import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { applyMarketingC1Theme, assertMarketingAccentNotBlue } from './marketing-c1-web-theme.mjs';

/**
 * Ordnerbaum marketing PNGs (landing). Re-render only after #80 + #88 (library + SegmentedControl).
 * Set WRITE_FOLDERS_PNGS=0 to skip writing PNGs (default: write).
 */
const siteScripts = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(siteScripts, '../../..');
const sitePublic =
  process.env.SITE_PUBLIC ?? join(siteScripts, '..', 'public', 'screenshots');
const webUrl = process.env.WEB_URL ?? 'http://localhost:5173';
const webHost = new URL(webUrl).hostname;
const writePngs = process.env.WRITE_FOLDERS_PNGS !== '0';

mkdirSync(sitePublic, { recursive: true });

const locales = ['de', 'en'];
const themes = ['light', 'dark'];
const VIEWPORT = { width: 1440, height: 960 };
const DEVICE_SCALE = 2;

const FORBIDDEN_TREE_LABELS = ['EHW+', 'Sehr langer Ordnername', 'Direkt'];

const marketingCaptureStyle = `
  .dateisystem-tree-actions,
  .dateisystem-tree-row.is-selected .dateisystem-tree-actions,
  .dateisystem-tree-row:hover .dateisystem-tree-actions,
  .dateisystem-tree-row:focus-within .dateisystem-tree-actions {
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;

function localeInitScript(locale, theme) {
  return `(() => {
    localStorage.setItem('docuvate.locale', ${JSON.stringify(locale)});
    ${theme ? `localStorage.setItem('docuvate-theme', ${JSON.stringify(theme)});
    document.documentElement.setAttribute('data-docuvate-theme', ${JSON.stringify(theme)});` : ''}
    document.documentElement.lang = ${JSON.stringify(locale === 'de' ? 'de' : 'en')};
  })();`;
}

function launchChromiumForLocale(locale) {
  const lang = locale === 'de' ? 'de-DE' : 'en-US';
  return chromium.launch({
    args: [`--lang=${lang}`],
    env: {
      ...process.env,
      ...(locale === 'de'
        ? { LANG: 'de_DE.UTF-8', LC_ALL: 'de_DE.UTF-8' }
        : { LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }),
    },
  });
}

function themeMenuLabel(locale, theme) {
  if (locale === 'de') {
    return theme === 'dark' ? 'Dunkles Design' : 'Helles Design';
  }
  return theme === 'dark' ? 'Dark theme' : 'Light theme';
}

function runFoldersMarketingSeed(locale) {
  const seed = spawnSync('node', [join(repoRoot, 'scripts/seed-folders-marketing.mjs')], {
    encoding: 'utf8',
    env: {
      ...process.env,
      LOCALE: locale,
      AUTH_BASE: process.env.AUTH_BASE ?? 'http://127.0.0.1:3001/api/auth',
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate',
      WEB_ORIGIN: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    },
  });
  if (seed.status !== 0) {
    process.stderr.write(seed.stderr ?? '');
    throw new Error(`seed-folders-marketing.mjs failed (${locale})`);
  }
  const trimmed = seed.stdout.trim();
  const jsonStart = trimmed.indexOf('{');
  if (jsonStart < 0) {
    throw new Error('seed-folders-marketing.mjs did not print JSON');
  }
  return JSON.parse(trimmed.slice(jsonStart));
}

async function addSession(context, authCookie) {
  const value = authCookie.includes('=') ? authCookie.split('=').slice(1).join('=') : authCookie;
  await context.addCookies([
    {
      name: 'better-auth.session_token',
      value: decodeURIComponent(value),
      domain: webHost,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function applyThemeViaAccountMenu(page, locale, theme) {
  await page.locator('.user-account-menu-trigger').click();
  await page.getByRole('menuitem', { name: themeMenuLabel(locale, theme) }).click();
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
}

async function assertDarkBodyBackground(page) {
  const theme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-docuvate-theme')
  );
  if (theme !== 'dark') {
    throw new Error(`Expected data-docuvate-theme=dark after account menu, got "${theme}"`);
  }
  const darkEnough = await page.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return false;
    return Number(m[1]) <= 45 && Number(m[2]) <= 45 && Number(m[3]) <= 55;
  });
  if (!darkEnough) {
    throw new Error('Body background is not a dark theme color');
  }
}

async function expandContractsFolder(page, manifest) {
  const childLink = page.locator('a.dateisystem-tree-link', {
    hasText: new RegExp(`^${manifest.insuranceFolderName}$`),
  });
  if ((await childLink.count()) > 0 && (await childLink.first().isVisible())) {
    return;
  }
  const contractsRow = page.locator('.dateisystem-tree-row').filter({
    has: page.locator('a.dateisystem-tree-link', { hasText: manifest.contractsFolderName }),
  });
  await contractsRow.locator('button.dateisystem-tree-chevron').click();
  await childLink.first().waitFor({ state: 'visible', timeout: 15_000 });
}

async function prepareOrdnerTree(page, manifest) {
  await page.goto(`${webUrl}/filesystem`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.locator('.dateisystem-shell').waitFor({ state: 'visible', timeout: 45_000 });
  await page.addStyleTag({ content: marketingCaptureStyle });

  await page
    .locator('a.sidebar-mappe-link.dateisystem-tree-link', { hasText: manifest.mappeName })
    .click();
  await page.waitForURL(/\/filesystem\/containers\//, { timeout: 20_000 });

  await expandContractsFolder(page, manifest);

  const focusLink = page.locator('a.dateisystem-tree-link', {
    hasText: new RegExp(`^${manifest.focusFolderName}$`),
  });
  await focusLink.waitFor({ state: 'visible', timeout: 15_000 });
  await focusLink.click();
  await page.waitForURL(new RegExp(`/filesystem/folders/${manifest.focusFolderId}`), {
    timeout: 15_000,
  });
  await page.waitForTimeout(500);

  const sidebarText = await page.locator('.dateisystem-sidebar').innerText();
  for (const forbidden of FORBIDDEN_TREE_LABELS) {
    if (sidebarText.includes(forbidden)) {
      throw new Error(`Marketing tree must not include "${forbidden}"`);
    }
  }

  const rows = page.locator('.library-table tbody tr, .library-document-grid article');
  await page.waitForFunction(
    (min) => {
      const tableRows = document.querySelectorAll('.library-table tbody tr');
      const cards = document.querySelectorAll('.library-document-grid article');
      return tableRows.length >= min || cards.length >= min;
    },
    manifest.expectedFocusDocCount,
    { timeout: 20_000 }
  );

  const readyBadge = page.locator('.library-table tbody tr').first().getByText(/Bereit|Ready/);
  await readyBadge.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);

  await page.mouse.move(8, 8);
  await page.locator('.dateisystem-content-header').hover({ force: true }).catch(() => undefined);
  await page.mouse.move(8, 8);
}

async function screenshotOrdnerShell(page, path, theme) {
  await applyMarketingC1Theme(page, theme);
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('.dateisystem-content-header .btn-primary, .btn-primary');
      if (!btn) return true;
      const bg = getComputedStyle(btn).backgroundColor;
      return !bg.includes('47, 62, 140') && !bg.includes('22, 79, 160');
    },
    { timeout: 10_000 }
  );
  await page.addStyleTag({ content: marketingCaptureStyle });
  const shell = page.locator('.dateisystem-shell');
  await shell.waitFor({ state: 'visible', timeout: 15_000 });
  await page.mouse.move(0, 0);
  if (writePngs) {
    await shell.screenshot({ path });
  }
}

if (!writePngs) {
  console.log('WRITE_FOLDERS_PNGS=0 — seed/navigation checks only, no PNG files written.');
}

for (const locale of locales) {
  const manifest = runFoldersMarketingSeed(locale);
  const browser = await launchChromiumForLocale(locale);
  for (const theme of themes) {
    const suffix = `${locale}-${theme}`;
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE,
      colorScheme: theme,
      locale: locale === 'de' ? 'de-DE' : 'en-US',
      timezoneId: locale === 'de' ? 'Europe/Berlin' : 'America/New_York',
    });
    await addSession(context, manifest.authCookie);
    const page = await context.newPage();
    await page.addInitScript(localeInitScript(locale, theme === 'light' ? 'light' : undefined));

    await prepareOrdnerTree(page, manifest);
    await applyMarketingC1Theme(page, theme);
    await assertMarketingAccentNotBlue(page, `folders-${suffix}`);

    if (locale === 'en') {
      await page.getByRole('button', { name: 'English' }).click({ timeout: 5000 }).catch(() => undefined);
      await page.waitForTimeout(300);
    }

    if (theme === 'dark') {
      await applyThemeViaAccountMenu(page, locale, 'dark');
      await assertDarkBodyBackground(page);
      await prepareOrdnerTree(page, manifest);
      await applyMarketingC1Theme(page, theme);
      if (locale === 'en') {
        await page.getByRole('button', { name: 'English' }).click({ timeout: 5000 }).catch(() => undefined);
      }
    }

    await applyMarketingC1Theme(page, theme);
    const outPath = join(sitePublic, `folders-${suffix}.png`);
    await screenshotOrdnerShell(page, outPath, theme);
    await context.close();
    console.log(writePngs ? 'Captured folders' : 'Validated folders', suffix);
  }
  await browser.close();
}
