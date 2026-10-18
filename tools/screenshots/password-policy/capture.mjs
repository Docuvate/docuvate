#!/usr/bin/env node
/**
 * Password policy PR screenshots (1440 / 1024 / 390, light + dark).
 * Requires compose stack + tools/screenshots/admin/seed-admin-screenshots.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const OUT =
  process.env.SCREENSHOT_DIR ??
  path.join(ROOT, 'artifacts/screenshots/password-policy');
const WEB = process.env.DOCUVATE_WEB ?? 'http://localhost:5173';
const API = process.env.DOCUVATE_API ?? 'http://localhost:3001';
const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? 'elena.kraemer@beispiel.de';
const PASSWORD = process.env.SEED_PASSWORD ?? 'AdminDemo12!';

const WIDTHS = [1440, 1024, 390];
const THEMES = ['light', 'dark'];

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
  const authDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docuvate-pw-policy-auth-'));
  const context = await browser.newContext();
  await signIn(context);
  await context.storageState({ path: path.join(authDir, 'state.json') });

  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({
        storageState: path.join(authDir, 'state.json'),
        viewport: { width, height: 900 },
      });
      await setTheme(page, theme);
      await page.goto(`${WEB}/settings/admin`, { waitUntil: 'networkidle' });
      await capture(page, path.join(OUT, `admin-password-policy-${width}-${theme}.png`));
      await page.close();
    }
    for (const width of WIDTHS) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
      });
      await setTheme(page, theme);
      await page.goto(`${WEB}/register`, { waitUntil: 'networkidle' });
      await capture(page, path.join(OUT, `register-checklist-${width}-${theme}.png`));
      await page.close();
    }
  }

  await browser.close();
  process.stdout.write(`Wrote password-policy screenshots to ${OUT}\n`);
}

main().catch((err) => {
  process.stderr.write(`${String(err)}\n`);
  process.exit(1);
});
