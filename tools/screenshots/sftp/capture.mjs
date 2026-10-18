#!/usr/bin/env node
/**
 * SFTP ingress screenshots (full viewport, synthetic data).
 * Output: SCREENSHOT_DIR or artifacts/screenshots/sftp (repo-relative).
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://localhost:3001';
const OUT = process.env.SCREENSHOT_DIR ?? join(ROOT, 'artifacts/screenshots/sftp');
const ARTIFACT_MIRROR = process.env.SCREENSHOT_ARTIFACT_DIR ?? null;
const EMAIL = process.env.SEED_EMAIL ?? 'elena.kraemer@beispiel.de';
const PASSWORD = process.env.SEED_PASSWORD ?? 'AdminDemo12!';

const THEME_PREF_KEY = 'docuvate-theme-preference';
const THEME_LEGACY_KEY = 'docuvate-theme';
const LOCALE_KEY = 'docuvate.locale';

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (/\/(documents|library)/.test(page.url())) {
      return;
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`Login timed out at ${page.url()}`);
}

async function applyPreferences(page, locale, theme) {
  const patch = await page.request.patch(`${AUTH_BASE}/v1/settings`, {
    headers: { 'content-type': 'application/json' },
    data: { themePreference: theme, locale },
  });
  if (!patch.ok()) {
    throw new Error(`PATCH /settings failed ${patch.status()}: ${await patch.text()}`);
  }

  await page.evaluate(
    ({ locale, theme, themePrefKey, themeLegacyKey, localeKey }) => {
      localStorage.setItem(themePrefKey, theme);
      localStorage.setItem(themeLegacyKey, theme);
      localStorage.setItem(localeKey, locale);
    },
    {
      locale,
      theme,
      themePrefKey: THEME_PREF_KEY,
      themeLegacyKey: THEME_LEGACY_KEY,
      localeKey: LOCALE_KEY,
    },
  );

  await page.goto(`${BASE}/settings/connectors`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('.connector-sftp-card', { timeout: 30_000 });

  await page.waitForFunction(
    ({ locale, theme }) => {
      const resolvedTheme = document.documentElement.getAttribute('data-docuvate-theme');
      const lang = document.documentElement.lang;
      const langOk = lang === locale || lang.startsWith(`${locale}-`);
      return resolvedTheme === theme && langOk;
    },
    { locale, theme },
    { timeout: 30_000 },
  );

  const uiLocaleProbe =
    locale === 'en'
      ? page.getByRole('link', { name: /^Connections$/i })
      : page.getByRole('link', { name: /^Verbindungen$/i });
  await uiLocaleProbe.waitFor({ state: 'visible', timeout: 15_000 });
}

async function maskSecrets(page) {
  await page.evaluate(() => {
    document.querySelectorAll('code').forEach((el) => {
      const t = el.textContent ?? '';
      if (/sha256:/i.test(t) && t.length > 24) {
        return;
      }
      if (/(passwort|password|geheim|secret)/i.test(t) && t.length > 12) {
        el.textContent = '••••••••••••';
      }
    });
  });
}

async function waitConfiguredCard(page) {
  await page.waitForSelector('.connector-sftp-active-badge', { timeout: 30_000 });
  await page.waitForFunction(
    () => {
      const code = document.querySelector('.connector-sftp-card code');
      return code && !code.textContent?.includes('—') && code.textContent.includes(':');
    },
    { timeout: 30_000 },
  );
}

async function assertShotEnvironment(page, locale, theme) {
  const snapshot = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-docuvate-theme'),
    lang: document.documentElement.lang,
  }));
  if (snapshot.theme !== theme) {
    throw new Error(`Expected data-docuvate-theme=${theme}, got ${snapshot.theme}`);
  }
  if (snapshot.lang !== locale && !snapshot.lang.startsWith(`${locale}-`)) {
    throw new Error(`Expected html lang=${locale}, got ${snapshot.lang}`);
  }
}

async function fullViewportShot(page, path) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path, fullPage: false });
}

async function main() {
  execFileSync(process.execPath, ['tools/screenshots/sftp/seed-sftp-screenshots.mjs'], {
    cwd: ROOT,
    env: { ...process.env, SFTP_SCREENSHOT_ACCOUNT_COUNT: '2' },
    stdio: 'inherit',
  });

  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page);

  const viewportVariants = [
    ['de', 'light', 'de-light-1280', 1280, 900],
    ['de', 'dark', 'de-dark-1280', 1280, 900],
    ['de', 'light', 'de-light-390', 390, 900],
    ['de', 'dark', 'de-dark-390', 390, 900],
  ];

  const index = [];
  for (const [locale, theme, tag, w, h] of viewportVariants) {
    await page.setViewportSize({ width: w, height: h });
    await applyPreferences(page, locale, theme);
    await waitConfiguredCard(page);
    await assertShotEnvironment(page, locale, theme);
    await maskSecrets(page);
    const file = `connectors-sftp-scanner-${tag}.png`;
    await fullViewportShot(page, join(OUT, file));
    index.push({ file, desc: `Scanner SFTP ingress configured (${tag}, ${w}×${h})` });
  }

  async function openSftpFetchConnectDialog(page) {
    const card = page.locator('.connector-catalog-card').filter({
      has: page.getByRole('heading', { name: 'SFTP-Server abholen' }),
    });
    await card.getByRole('button', { name: /^Verbinden$/i }).click();
    await page.waitForSelector('dialog[open] form', { timeout: 15_000 });
  }

  async function fillSftpFetchForm(page) {
    const form = page.locator('dialog[open] form');
    await form.getByLabel('Anzeigename', { exact: true }).fill('NAS Scans Büro');
    await form.getByLabel('Host', { exact: true }).fill('sftp.beispiel-intern.local');
    await form.getByLabel('Port', { exact: true }).fill('22');
    await form.getByLabel('Benutzername', { exact: true }).fill('scan-import');
    await form.getByLabel('Passwort', { exact: true }).fill('synthetic-demo-passwort');
    await form.getByLabel('Remote-Pfad', { exact: true }).fill('/scans/inbox');
    await form.getByLabel('Host-Key-Fingerabdruck (SHA-256)', { exact: true }).fill(
      'SHA256:AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abCD',
    );
    await form.getByLabel('Abholintervall (Sekunden)', { exact: true }).fill('300');
    await form.getByLabel('Nach Import', { exact: true }).fill('delete');
  }

  for (const [locale, theme, tag, w, h] of viewportVariants) {
    await page.setViewportSize({ width: w, height: h });
    await applyPreferences(page, locale, theme);
    await openSftpFetchConnectDialog(page);
    await fillSftpFetchForm(page);
    await assertShotEnvironment(page, locale, theme);
    await maskSecrets(page);
    const file = `connectors-sftp-pull-${tag}.png`;
    await fullViewportShot(page, join(OUT, file));
    index.push({ file, desc: `SFTP pull connector connect dialog (${tag}, ${w}×${h})` });
    await page.keyboard.press('Escape');
    await page.waitForSelector('dialog[open]', { state: 'detached', timeout: 10_000 }).catch(() => {});
  }

  await browser.close();

  const md = ['# SFTP ingress screenshots', '', ...index.map((r) => `- \`${r.file}\`: ${r.desc}`), ''].join('\n');
  await writeFile(join(OUT, 'index.md'), md);
  if (ARTIFACT_MIRROR) {
    await mkdir(ARTIFACT_MIRROR, { recursive: true });
    for (const row of index) {
      await copyFile(join(OUT, row.file), join(ARTIFACT_MIRROR, row.file));
    }
    await writeFile(join(ARTIFACT_MIRROR, 'index.md'), md);
  }
  console.log('Wrote', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
