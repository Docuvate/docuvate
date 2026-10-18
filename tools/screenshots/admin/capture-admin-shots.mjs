#!/usr/bin/env node
/** Admin IAM UI screenshots (synthetic @beispiel.de users only; never log invite tokens). */
import { execFileSync, execSync } from 'node:child_process';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const OUT =
  process.env.SCREENSHOT_DIR ?? path.join(process.cwd(), 'tmp', 'admin-screenshots');
const AUTH = process.env.AUTH_BASE ?? 'http://localhost:3001/api/auth';
const API = process.env.API_BASE ?? 'http://localhost:3001/v1';
const MAILPIT = process.env.MAILPIT_API ?? 'http://localhost:8025/api/v1';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'elena.kraemer@beispiel.de';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'AdminDemo12!';
const MEMBER_EMAIL = 'julia.koehler@beispiel.de';
const MEMBER_PASSWORD = 'MemberDemo12!';
const INVITE_SCREENSHOT_EMAIL = 'screenshot.invite@beispiel.de';
const COMPOSE_ARGS = process.env.COMPOSE_FILE
  ? process.env.COMPOSE_FILE.split(':').flatMap((f) => ['-f', f])
  : ['-f', 'docker-compose.yml'];

function resetMemberTotpEnrollment() {
  const email = MEMBER_EMAIL.replace(/'/g, "''");
  const sql = `
    DELETE FROM "twoFactor" WHERE "userId" IN (
      SELECT id FROM "user" WHERE lower(email) = lower('${email}')
    );
    UPDATE "user" SET "twoFactorEnabled" = false WHERE lower(email) = lower('${email}');
  `;
  execFileSync(
    'docker',
    ['compose', ...COMPOSE_ARGS, 'exec', '-T', 'postgres', 'psql', '-U', 'docuvate', '-d', 'docuvate', '-c', sql],
    { stdio: 'pipe', cwd: process.cwd() }
  );
}

function resetAdminSecurityFactors() {
  const email = ADMIN_EMAIL.replace(/'/g, "''");
  const sql = `
    DELETE FROM "twoFactor" WHERE "userId" IN (
      SELECT id FROM "user" WHERE lower(email) = lower('${email}')
    );
    UPDATE "user" SET "twoFactorEnabled" = false WHERE lower(email) = lower('${email}');
    DELETE FROM passkey WHERE "userId" IN (
      SELECT id FROM "user" WHERE lower(email) = lower('${email}')
    );
  `;
  execFileSync(
    'docker',
    ['compose', ...COMPOSE_ARGS, 'exec', '-T', 'postgres', 'psql', '-U', 'docuvate', '-d', 'docuvate', '-c', sql],
    { stdio: 'pipe', cwd: process.cwd() }
  );
}

async function signIn(email, password) {
  const res = await fetch(`${AUTH}/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: WEB_ORIGIN },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`sign-in failed for ${email}: ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookies = [];
  for (const raw of setCookie) {
    const part = raw.split(';')[0];
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    cookies.push({
      name: part.slice(0, eq),
      value: part.slice(eq + 1),
      domain: 'localhost',
      path: '/',
    });
  }
  return cookies;
}

function sessionCookieHeader(sessionCookies) {
  return sessionCookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

async function patchAccountThemePreference(sessionCookies, themePreference) {
  const res = await fetch(`${API}/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Origin: WEB_ORIGIN,
      Cookie: sessionCookieHeader(sessionCookies),
    },
    body: JSON.stringify({ themePreference }),
  });
  if (!res.ok) {
    throw new Error(`PATCH /settings themePreference=${themePreference} failed: ${res.status}`);
  }
}

function themeInitScript(themePreference) {
  const resolved =
    themePreference === 'light' || themePreference === 'dark'
      ? themePreference
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  localStorage.setItem('docuvate-theme-preference', themePreference);
  localStorage.setItem('docuvate-theme', resolved);
  localStorage.setItem('docuvate.locale', 'de');
  document.documentElement.setAttribute('data-docuvate-theme', resolved);
  document.documentElement.setAttribute('lang', 'de');
}

async function assertResolvedTheme(page, expected) {
  await page.waitForFunction(
    (theme) => document.documentElement.getAttribute('data-docuvate-theme') === theme,
    expected,
    { timeout: 15_000 }
  );
}

async function blurTotpSecret(page) {
  await page.evaluate(() => {
    const qr = document.querySelector('.settings-totp-qr');
    if (qr) {
      Object.assign(qr.style, { filter: 'blur(10px)', userSelect: 'none' });
    }
    const el = document.querySelector('.settings-totp-uri');
    if (el) {
      el.textContent = 'otpauth://totp/Docuvate:user@example.com?secret=••••••••••••&issuer=Docuvate';
      Object.assign(el.style, { filter: 'blur(6px)', userSelect: 'none' });
    }
    document.querySelectorAll('.settings-backup-codes code').forEach((node) => {
      node.textContent = '••••-••••';
      Object.assign(node.style, { filter: 'blur(4px)', userSelect: 'none' });
    });
  });
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  if (overflow) {
    throw new Error('page overflows horizontally');
  }
}

async function assertMobileAdminListLayout(page) {
  await page.waitForFunction(
    () => {
      const table = document.querySelector('.admin-users-table--wide');
      if (!table) return false;
      const style = window.getComputedStyle(table);
      return style.display === 'none';
    },
    null,
    { timeout: 8_000 }
  );
  const cards = page.locator('.admin-users-card-list');
  await cards.waitFor({ state: 'visible', timeout: 8_000 });
}

async function closeMobileNavIfOpen(page) {
  const openShell = page.locator('.app-shell-mobile-nav-open');
  if (!(await openShell.count())) {
    return;
  }
  const backdrop = page.locator('.app-sidebar-backdrop');
  if (await backdrop.isVisible().catch(() => false)) {
    await backdrop.click({ force: true });
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForFunction(
    () => !document.querySelector('.app-shell-mobile-nav-open'),
    null,
    { timeout: 8_000 }
  );
}

async function inviteAcceptUrlFromMailpit(recipientEmail) {
  const listRes = await fetch(`${MAILPIT}/messages?limit=50`);
  if (!listRes.ok) throw new Error(`mailpit list failed: ${listRes.status}`);
  const list = await listRes.json();
  const messages = list.messages ?? [];
  for (const summary of messages) {
    const msgRes = await fetch(`${MAILPIT}/message/${summary.ID}`);
    if (!msgRes.ok) continue;
    const msg = await msgRes.json();
    const to = (msg.To ?? []).map((t) => t.Address?.toLowerCase());
    if (!to.includes(recipientEmail.toLowerCase())) continue;
    const body = `${msg.Text ?? ''}\n${msg.HTML ?? ''}`;
    const match = body.match(/\/invite\?token=([A-Za-z0-9_-]+)/);
    if (match) {
      return `${BASE}/invite?token=${match[1]}`;
    }
  }
  throw new Error(`no invitation mail for ${recipientEmail}`);
}

async function createScreenshotInvitation(adminCookies) {
  await fetch(`${API}/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: WEB_ORIGIN,
      Cookie: sessionCookieHeader(adminCookies),
    },
    body: JSON.stringify({
      email: INVITE_SCREENSHOT_EMAIL,
      name: 'Screenshot Invite',
      role: 'member',
    }),
  }).catch(() => undefined);
  return inviteAcceptUrlFromMailpit(INVITE_SCREENSHOT_EMAIL);
}

async function withAdminPage(sessionCookies, viewport, themePreference, fn) {
  const resolvedTheme = themePreference === 'dark' ? 'dark' : 'light';
  await patchAccountThemePreference(sessionCookies, themePreference);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    locale: 'de-DE',
    colorScheme: resolvedTheme,
  });
  await context.addCookies(sessionCookies);
  await context.addInitScript(themeInitScript, themePreference);
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await assertResolvedTheme(page, resolvedTheme);
  await fn(page, resolvedTheme);
  await browser.close();
}

async function scrollAdminListToOwnRow(page) {
  const ownRow = page.locator('.admin-users-table tbody tr, .admin-users-card').filter({
    hasText: /kraemer@/i,
  });
  await ownRow.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const adminCookies = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
  const memberCookies = await signIn(MEMBER_EMAIL, MEMBER_PASSWORD);

  await withAdminPage(adminCookies, { width: 1280, height: 1200 }, 'light', async (page) => {
    await page.goto(`${BASE}/settings/admin/users`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.admin-users-table', { timeout: 25_000 });
    await scrollAdminListToOwnRow(page);
    await page.screenshot({ path: `${OUT}/01-admin-users-1280-light.png`, fullPage: true });

    const invitePanel = page.locator('.admin-invite-panel');
    await invitePanel.scrollIntoViewIfNeeded();
    await invitePanel.screenshot({ path: `${OUT}/04-admin-invite-panel-1280-light.png` });

    const memberRow = page.locator('.admin-users-table tbody tr').filter({ hasText: /koehler@/i }).first();
    await memberRow.locator('.custom-select-trigger').click();
    await page.getByRole('option', { name: /administrator/i }).waitFor({ state: 'visible' });
    await page.screenshot({ path: `${OUT}/05-admin-role-menu-1280-light.png` });
    await page.keyboard.press('Escape');

    const blockedRow = page.locator('.admin-users-table tbody tr').filter({ hasText: /jonas\.weber@/i }).first();
    await blockedRow.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${OUT}/13-admin-users-suspended-row-1280-light.png`, fullPage: true });

    const memberActions = page.locator('.admin-users-table tbody tr').filter({ hasText: /koehler@/i }).first();
    await memberActions.locator('.admin-users-overflow-btn').click();
    await page.getByRole('menuitem', { name: /sperren|suspend/i }).first().click();
    await page.waitForSelector('.confirm-dialog, [role="dialog"]', { timeout: 10_000 });
    await page.screenshot({ path: `${OUT}/14-admin-suspend-dialog-1280-light.png`, fullPage: true });
    await page.keyboard.press('Escape');
  });

  await withAdminPage(adminCookies, { width: 1280, height: 1200 }, 'dark', async (page) => {
    await page.goto(`${BASE}/settings/admin/users`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.admin-users-table', { timeout: 25_000 });
    await scrollAdminListToOwnRow(page);
    await page.screenshot({ path: `${OUT}/02-admin-users-1280-dark.png`, fullPage: true });
  });

  await withAdminPage(adminCookies, { width: 390, height: 844 }, 'light', async (page) => {
    await page.goto(`${BASE}/settings/admin/users`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.admin-users-card-list', { timeout: 25_000 });
    await closeMobileNavIfOpen(page);
    await assertMobileAdminListLayout(page);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: `${OUT}/03-admin-users-390-light.png`, fullPage: true });
    const list = page.locator('.admin-users-card-list .admin-users-card, .admin-users-card-list li').first();
    if (await list.count()) {
      await list.scrollIntoViewIfNeeded();
      await closeMobileNavIfOpen(page);
      await page.screenshot({ path: `${OUT}/15-admin-users-390-list-light.png`, fullPage: true });
    }
  });

  await withAdminPage(adminCookies, { width: 390, height: 844 }, 'dark', async (page) => {
    await page.goto(`${BASE}/settings/admin/users`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.admin-users-card-list', { timeout: 25_000 });
    await closeMobileNavIfOpen(page);
    await assertMobileAdminListLayout(page);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({ path: `${OUT}/09-admin-users-390-dark.png`, fullPage: true });
    const list = page.locator('.admin-users-card-list .admin-users-card, .admin-users-card-list li').first();
    if (await list.count()) {
      await list.scrollIntoViewIfNeeded();
      await closeMobileNavIfOpen(page);
      await page.screenshot({ path: `${OUT}/16-admin-users-390-list-dark.png`, fullPage: true });
    }
  });

  const inviteUrl = await createScreenshotInvitation(adminCookies);
  const inviteBrowser = await chromium.launch({ headless: true });
  const inviteContext = await inviteBrowser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'de-DE' });
  const invitePage = await inviteContext.newPage();
  await invitePage.goto(inviteUrl, { waitUntil: 'networkidle' });
  await invitePage.waitForSelector('.auth-card', { timeout: 20_000 });
  await invitePage.waitForFunction(() => !window.location.search.includes('token='), null, { timeout: 8000 });
  await invitePage.screenshot({ path: `${OUT}/08-invite-accept-1280-light.png`, fullPage: true });
  await inviteBrowser.close();

  resetAdminSecurityFactors();
  await withAdminPage(adminCookies, { width: 1280, height: 900 }, 'light', async (page) => {
    await page.goto(`${BASE}/settings/account-security`, { waitUntil: 'networkidle' });
    await closeMobileNavIfOpen(page);
    await page.screenshot({ path: `${OUT}/17-account-security-no-factors-1280-light.png`, fullPage: true });
  });

  resetMemberTotpEnrollment();
  const desktopSecurityShots = [
    { theme: 'light', file: '06-account-security-1280-light.png' },
    { theme: 'dark', file: '10-account-security-1280-dark.png' },
  ];
  const mobileSecurityShots = [
    { theme: 'light', file: '11-account-security-390-light.png' },
    { theme: 'dark', file: '12-account-security-390-dark.png' },
  ];

  const secBrowser = await chromium.launch({ headless: true });
  const desktopContext = await secBrowser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'de-DE',
  });
  await desktopContext.addCookies(memberCookies);
  const desktopPage = await desktopContext.newPage();
  await desktopPage.addInitScript(themeInitScript, 'light');
  await desktopPage.goto(`${BASE}/settings/account-security`, { waitUntil: 'networkidle' });
  await closeMobileNavIfOpen(desktopPage);
  await desktopPage.getByLabel(/passwort/i).first().fill(MEMBER_PASSWORD);
  await desktopPage.getByRole('button', { name: /totp|einrichten/i }).first().click();
  await desktopPage.waitForSelector('.settings-totp-qr', { timeout: 25_000 });

  for (const shot of desktopSecurityShots) {
    const resolvedTheme = shot.theme === 'dark' ? 'dark' : 'light';
    await patchAccountThemePreference(memberCookies, shot.theme);
    await desktopPage.evaluate(themeInitScript, shot.theme);
    await assertResolvedTheme(desktopPage, resolvedTheme);
    await blurTotpSecret(desktopPage);
    await closeMobileNavIfOpen(desktopPage);
    await desktopPage.screenshot({ path: `${OUT}/${shot.file}`, fullPage: true });
  }
  await desktopContext.close();

  for (const shot of mobileSecurityShots) {
    const resolvedTheme = shot.theme === 'dark' ? 'dark' : 'light';
    await patchAccountThemePreference(memberCookies, shot.theme);
    const mobileContext = await secBrowser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'de-DE',
      colorScheme: resolvedTheme,
    });
    await mobileContext.addCookies(memberCookies);
    await mobileContext.addInitScript(themeInitScript, shot.theme);
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE}/settings/account-security`, { waitUntil: 'networkidle' });
    await assertResolvedTheme(mobilePage, resolvedTheme);
    await closeMobileNavIfOpen(mobilePage);
    if ((await mobilePage.locator('.settings-totp-qr').count()) === 0) {
      await mobilePage.getByLabel(/passwort/i).first().fill(MEMBER_PASSWORD);
      await mobilePage.getByRole('button', { name: /totp|einrichten/i }).first().click();
    }
    await mobilePage.waitForSelector('.settings-totp-qr', { timeout: 25_000 });
    await blurTotpSecret(mobilePage);
    await closeMobileNavIfOpen(mobilePage);
    await assertNoHorizontalOverflow(mobilePage);
    await mobilePage.screenshot({ path: `${OUT}/${shot.file}`, fullPage: true });
    await mobileContext.close();
  }
  await secBrowser.close();

  const tfaBrowser = await chromium.launch({ headless: true });
  const tfaContext = await tfaBrowser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'de-DE',
  });
  const tfaPage = await tfaContext.newPage();
  await tfaPage.addInitScript(() => {
    localStorage.setItem('docuvate.locale', 'de');
    document.documentElement.setAttribute('lang', 'de');
  });
  await tfaPage.goto(`${BASE}/login/two-factor`, { waitUntil: 'networkidle' });
  await tfaPage.waitForSelector('.auth-card', { timeout: 15_000 });
  await tfaPage.screenshot({ path: `${OUT}/07-login-two-factor-1280-light.png`, fullPage: true });
  await tfaBrowser.close();

  const lightPath = `${OUT}/01-admin-users-1280-light.png`;
  const darkPath = `${OUT}/02-admin-users-1280-dark.png`;
  const lightStat = await stat(lightPath);
  const darkStat = await stat(darkPath);
  if (lightStat.size === darkStat.size) {
    throw new Error(`dark users list matches light byte size (${lightStat.size}); theme not applied`);
  }

  const headSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const files = (await readdir(OUT)).filter((f) => f.endsWith('.png')).sort();
  await writeFile(
    `${OUT}/manifest.json`,
    `${JSON.stringify({ headSha, capturedAt: new Date().toISOString(), files }, null, 2)}\n`
  );
  process.stderr.write(`capture-admin-shots: ${files.length} png in ${OUT} @ ${headSha}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
