#!/usr/bin/env node
/**
 * PR-E auth screenshots (1440 / 1024 / 390, light + dark): A1 login, E8 account security,
 * E8b/E8c dialogs, E9 admin sign-in settings.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

import { totpFromOtpAuthUri } from './totp-code.mjs';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const OUT = process.env.SCREENSHOT_DIR ?? path.join(ROOT, 'docs/screenshots/pr-109');
const WEB = process.env.DOCUVATE_WEB ?? 'http://localhost:5173';
const API = process.env.DOCUVATE_API ?? 'http://localhost:3001';
const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? 'elena.kraemer@beispiel.de';
const PASSWORD = process.env.SEED_PASSWORD ?? 'AdminDemo12!';

const WIDTHS = [1440, 1024, 390];
const THEMES = ['light', 'dark'];

/** Match de/en account-security actions regardless of saved user locale. */
const CHANGE_EMAIL_BUTTON = /^(E-Mail ändern|Change email)$/i;
const CHANGE_EMAIL_DIALOG = /^(E-Mail ändern|Change email)$/i;
const REGENERATE_CODES_BUTTON = /^(Wiederherstellungscodes erneuern|Regenerate recovery codes)$/i;
const REGENERATE_CODES_DIALOG = /^(Wiederherstellungscodes erneuern|Regenerate recovery codes)$/i;
const DIALOG_CANCEL = /^(Abbrechen|Cancel)$/i;
const TOTP_START = /^(Set up TOTP|TOTP einrichten)$/i;
const TOTP_SHOW_KEY = /^(Show secret key|Schlüssel anzeigen)$/i;
const TOTP_CONFIRM = /^(Finish setup|Einrichtung abschließen)$/i;
const PASSWORD_FIELD = /^(Current password|Aktuelles Passwort|Password|Passwort)$/i;
const TOTP_CODE_FIELD = /^(One-time code|Einmalcode|TOTP code|TOTP-Code)$/i;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function signIn(context) {
  const res = await context.request.post(`${API}/api/auth/sign-in/email`, {
    data: { email: EMAIL, password: PASSWORD },
    headers: { origin: WEB, 'content-type': 'application/json' },
  });
  if (!res.ok()) {
    throw new Error(`sign-in failed: ${res.status()} ${await res.text()}`);
  }
}

async function setTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' });
  await page.evaluate((mode) => {
    document.documentElement.dataset.theme = mode;
  }, theme);
}

async function capture(page, file) {
  ensureDir(path.dirname(file));
  await page.screenshot({ path: file, fullPage: true });
}

/** Enables TOTP once so E8b regenerate-codes dialog is available in screenshots. */
async function ensureTotpEnabled(page) {
  await page.goto(`${WEB}/settings/account-security`, { waitUntil: 'networkidle' });
  const regenButton = page.getByRole('button', { name: REGENERATE_CODES_BUTTON });
  if (await regenButton.isVisible()) {
    return;
  }
  const startForm = page.locator('form').filter({ has: page.getByRole('button', { name: TOTP_START }) });
  await startForm.getByLabel(PASSWORD_FIELD).fill(PASSWORD);
  await startForm.getByRole('button', { name: TOTP_START }).click();
  await page.getByRole('button', { name: TOTP_SHOW_KEY }).click();
  const uri = (await page.locator('.settings-totp-uri').textContent())?.trim();
  if (!uri) {
    throw new Error('TOTP secret URI missing after enrollment start');
  }
  const confirmForm = page.locator('form').filter({ has: page.getByRole('button', { name: TOTP_CONFIRM }) });
  await confirmForm.getByLabel(TOTP_CODE_FIELD).fill(totpFromOtpAuthUri(uri));
  await confirmForm.getByRole('button', { name: TOTP_CONFIRM }).click();
  await regenButton.waitFor({ state: 'visible', timeout: 60_000 });
}

async function main() {
  if (process.env.SKIP_ADMIN_SEED !== '1') {
    execFileSync(process.execPath, ['tools/screenshots/admin/seed-admin-screenshots.mjs'], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, SEED_PURGE_NON_DEMO: process.env.SEED_PURGE_NON_DEMO ?? '1' },
    });
  }

  ensureDir(OUT);
  const browser = await chromium.launch();
  const authDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docuvate-auth-pr-e-'));
  const context = await browser.newContext();
  await signIn(context);
  const setupPage = await context.newPage();
  await ensureTotpEnabled(setupPage);
  await setupPage.close();
  await context.storageState({ path: path.join(authDir, 'state.json') });

  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const loginPage = await browser.newPage({ viewport: { width, height: 900 } });
      await setTheme(loginPage, theme);
      await loginPage.goto(`${WEB}/login`, { waitUntil: 'networkidle' });
      await capture(loginPage, path.join(OUT, `a1-login-${width}-${theme}.png`));
      await loginPage.close();

      const accountPage = await browser.newPage({
        storageState: path.join(authDir, 'state.json'),
        viewport: { width, height: 900 },
      });
      await setTheme(accountPage, theme);
      await accountPage.goto(`${WEB}/settings/account-security`, { waitUntil: 'networkidle' });
      await capture(accountPage, path.join(OUT, `e8-account-security-${width}-${theme}.png`));

      const changeEmailBtn = accountPage.getByRole('button', { name: CHANGE_EMAIL_BUTTON });
      await changeEmailBtn.waitFor({ state: 'visible' });
      for (let attempt = 0; attempt < 60; attempt += 1) {
        if (await changeEmailBtn.isEnabled()) break;
        await accountPage.waitForTimeout(500);
      }
      await changeEmailBtn.click();
      const changeEmailDialog = accountPage.getByRole('dialog', { name: CHANGE_EMAIL_DIALOG });
      await changeEmailDialog.waitFor({ state: 'visible' });
      await capture(accountPage, path.join(OUT, `e8e-change-email-dialog-${width}-${theme}.png`));
      await changeEmailDialog.getByRole('button', { name: DIALOG_CANCEL }).click();

      const regenButton = accountPage.getByRole('button', { name: REGENERATE_CODES_BUTTON });
      if (await regenButton.isVisible()) {
        await regenButton.click();
        const regenDialog = accountPage.getByRole('dialog', { name: REGENERATE_CODES_DIALOG });
        await regenDialog.waitFor({ state: 'visible' });
        await capture(accountPage, path.join(OUT, `e8b-regenerate-codes-dialog-${width}-${theme}.png`));
        await regenDialog.getByRole('button', { name: DIALOG_CANCEL }).click();
      }

      await accountPage.close();

      const adminPage = await browser.newPage({
        storageState: path.join(authDir, 'state.json'),
        viewport: { width, height: 900 },
      });
      await setTheme(adminPage, theme);
      await adminPage.goto(`${WEB}/settings/admin`, { waitUntil: 'networkidle' });
      await capture(adminPage, path.join(OUT, `e9-admin-auth-sign-in-${width}-${theme}.png`));
      await adminPage.close();
    }
  }

  await browser.close();
  console.log(`Wrote screenshots to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
