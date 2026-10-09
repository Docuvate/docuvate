#!/usr/bin/env node
/**
 * Comprehensive SFTP screenshot capture.
 * Captures: setup wizard (steps 1-3), validation errors, password reveal,
 * manage drawer, scanner badge (1280/390 light+dark), pull dialog variants, etc.
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://localhost:3001';
const OUT = process.env.SCREENSHOT_DIR ?? join(ROOT, 'tools/screenshots/sftp/out');
const EMAIL = process.env.SEED_EMAIL ?? 'elena.kraemer@beispiel.de';
const PASSWORD = process.env.SEED_PASSWORD ?? 'AdminDemo12!';
const HEAD_SHA = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();

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

  const index = [];

  // ============================================================
  // 1. Scanner badge: 1280×390 light+dark
  // ============================================================
  for (const [locale, theme, w, h] of [
    ['de', 'light', 1280, 900],
    ['de', 'dark', 1280, 900],
    ['de', 'light', 390, 900],
    ['de', 'dark', 390, 900],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await applyPreferences(page, locale, theme);
    await waitConfiguredCard(page);
    await maskSecrets(page);
    const file = `scanner-badge-${locale}-${theme}-${w}.png`;
    await fullViewportShot(page, join(OUT, file));
    index.push({ file, desc: `Scanner badge (${locale}, ${theme}, ${w}×${h})` });
  }

  // ============================================================
  // 2. Setup wizard: step 1 (empty, validation errors)
  // ============================================================
  await page.setViewportSize({ width: 1280, height: 900 });
  await applyPreferences(page, 'de', 'light');
  
  // Open setup dialog
  const setupBtn = page.locator('.connector-sftp-card').getByRole('button', { name: /Einrichten/i });
  await setupBtn.click();
  await page.waitForSelector('dialog[open] .connector-sftp-wizard-steps', { timeout: 15_000 });
  
  // Step 1 empty
  await page.waitForTimeout(500);
  let file = 'setup-wizard-step1-empty-de-light.png';
  await fullViewportShot(page, join(OUT, file));
  index.push({ file, desc: 'Setup wizard step 1 (empty, de, light)' });

  // Try to advance without filling -> validation errors
  const nextBtn = page.getByRole('button', { name: /Weiter/i });
  await nextBtn.click();
  await page.waitForTimeout(300);
  file = 'setup-wizard-step1-validation-errors-de-light.png';
  await fullViewportShot(page, join(OUT, file));
  index.push({ file, desc: 'Setup wizard step 1 validation errors (de, light)' });

  // ============================================================
  // 3. Setup wizard: step 1 filled
  // ============================================================
  await page.getByLabel('Anzeigename', { exact: true }).fill('Büro Scanner');
  await page.waitForTimeout(300);
  file = 'setup-wizard-step1-filled-de-light.png';
  await fullViewportShot(page, join(OUT, file));
  index.push({ file, desc: 'Setup wizard step 1 filled (de, light)' });

  // ============================================================
  // 4. Setup wizard: step 2 (device configuration)
  // ============================================================
  await nextBtn.click();
  await page.waitForSelector('.connector-sftp-wizard-step--active:has-text("Gerät")', { timeout: 5_000 });
  await page.waitForTimeout(500);
  file = 'setup-wizard-step2-device-de-light.png';
  await fullViewportShot(page, join(OUT, file));
  index.push({ file, desc: 'Setup wizard step 2 device config (de, light)' });

  // ============================================================
  // 5. Setup wizard: step 3 (password reveal)
  // ============================================================
  const createBtn = page.getByRole('button', { name: /Erstellen/i });
  await createBtn.click();
  await page.waitForSelector('.connector-sftp-wizard-step--active:has-text("Fertig")', { timeout: 10_000 });
  await page.waitForTimeout(500);
  file = 'setup-wizard-step3-password-reveal-de-light.png';
  await fullViewportShot(page, join(OUT, file));
  index.push({ file, desc: 'Setup wizard step 3 password reveal (de, light)' });

  // Close dialog
  await page.getByRole('button', { name: /Schließen|Fertig/i }).click();
  await page.waitForSelector('dialog[open]', { state: 'detached', timeout: 5_000 }).catch(() => {});

  // ============================================================
  // 6. Manage drawer
  // ============================================================
  await page.waitForTimeout(1000);
  await waitConfiguredCard(page);
  const manageBtn = page.locator('.connector-sftp-card').getByRole('button', { name: /Verwalten/i });
  await manageBtn.click();
  await page.waitForSelector('.connector-sftp-manage-drawer', { timeout: 10_000 });
  await page.waitForTimeout(500);
  await maskSecrets(page);
  file = 'manage-drawer-de-light.png';
  await fullViewportShot(page, join(OUT, file));
  index.push({ file, desc: 'Manage drawer (de, light)' });

  // Close drawer
  const closeDrawer = page.locator('.connector-sftp-manage-drawer-close');
  await closeDrawer.click();
  await page.waitForSelector('.connector-sftp-manage-drawer', { state: 'detached', timeout: 5_000 }).catch(() => {});

  // ============================================================
  // 7. Pull dialog variants
  // ============================================================
  async function openSftpFetchConnectDialog(page) {
    const card = page.locator('.connector-catalog-card').filter({
      has: page.getByRole('heading', { name: /SFTP.*abholen/i }),
    });
    await card.getByRole('button', { name: /Verbinden/i }).click();
    await page.waitForSelector('dialog[open] form', { timeout: 15_000 });
  }

  // Pull dialog - top (empty)
  await openSftpFetchConnectDialog(page);
  await page.waitForTimeout(500);
  file = 'pull-dialog-top-empty-de-light.png';
  await fullViewportShot(page, join(OUT, file));
  index.push({ file, desc: 'Pull dialog top (empty, de, light)' });

  // Pull dialog - middle (partially filled)
  await page.getByLabel('Anzeigename', { exact: true }).fill('NAS Scans');
  await page.getByLabel('Host', { exact: true }).fill('sftp.beispiel.local');
  await page.getByLabel('Port', { exact: true }).fill('22');
  await page.getByLabel('Benutzername', { exact: true }).fill('scan-user');
  await page.waitForTimeout(300);
  file = 'pull-dialog-middle-partial-de-light.png';
  await fullViewportShot(page, join(OUT, file));
  index.push({ file, desc: 'Pull dialog middle partial (de, light)' });

  // Pull dialog - bottom (all fields filled)
  await page.getByLabel('Passwort', { exact: true }).fill('demo-password');
  await page.getByLabel('Remote-Pfad', { exact: true }).fill('/scans/inbox');
  await page.getByLabel(/Host-Key.*Fingerabdruck/i).fill('SHA256:AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abCD');
  await page.getByLabel(/Abholintervall/i).fill('300');
  await page.waitForTimeout(300);
  await maskSecrets(page);
  file = 'pull-dialog-bottom-filled-de-light.png';
  await fullViewportShot(page, join(OUT, file));
  index.push({ file, desc: 'Pull dialog bottom filled (de, light)' });

  // Pull dialog - probe success (simulated via UI)
  // Note: Actual probe would need real SFTP server, so we'll just capture the button state
  const probeBtn = page.locator('.connector-sftp-probe button');
  await probeBtn.click();
  await page.waitForTimeout(2000); // Wait for probe attempt
  file = 'pull-dialog-probe-attempt-de-light.png';
  await fullViewportShot(page, join(OUT, file));
  index.push({ file, desc: 'Pull dialog probe attempt (de, light)' });

  // Close dialog
  await page.keyboard.press('Escape');
  await page.waitForSelector('dialog[open]', { state: 'detached', timeout: 5_000 }).catch(() => {});

  // ============================================================
  // 8. Dark mode variants (key screens)
  // ============================================================
  await page.setViewportSize({ width: 1280, height: 900 });
  await applyPreferences(page, 'de', 'dark');
  await waitConfiguredCard(page);
  await maskSecrets(page);
  
  // Manage drawer dark
  await page.locator('.connector-sftp-card').getByRole('button', { name: /Verwalten/i }).click();
  await page.waitForSelector('.connector-sftp-manage-drawer', { timeout: 10_000 });
  await page.waitForTimeout(500);
  await maskSecrets(page);
  file = 'manage-drawer-de-dark.png';
  await fullViewportShot(page, join(OUT, file));
  index.push({ file, desc: 'Manage drawer (de, dark)' });
  
  await page.locator('.connector-sftp-manage-drawer-close').click();
  await page.waitForSelector('.connector-sftp-manage-drawer', { state: 'detached', timeout: 5_000 }).catch(() => {});

  await browser.close();

  // ============================================================
  // 9. Write manifest
  // ============================================================
  const manifest = {
    head: HEAD_SHA,
    feature: 'sftp',
    locale: 'de',
    capturedAt: new Date().toISOString(),
    screenshots: index,
  };
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  
  const md = [
    '# SFTP Comprehensive Screenshots',
    '',
    `HEAD: ${HEAD_SHA}`,
    `Captured: ${manifest.capturedAt}`,
    '',
    ...index.map((r) => `- \`${r.file}\`: ${r.desc}`),
    '',
  ].join('\n');
  await writeFile(join(OUT, 'index.md'), md);
  
  console.log(`✓ Captured ${index.length} screenshots to ${OUT}`);
  console.log(`✓ Manifest written with HEAD ${HEAD_SHA}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
