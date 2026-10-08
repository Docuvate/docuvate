#!/usr/bin/env node
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = process.env.SCREENSHOT_DIR ?? '/opt/cursor/artifacts/screenshots';
const BASE = process.env.WEB_BASE ?? 'http://localhost:5174';
const BASE_HOST = new URL(BASE).hostname;

function refreshSeed() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const seedOut = execSync('node scripts/seed-ordnerbaum-screenshots.mjs', {
        cwd: '/workspace',
        timeout: 120_000,
        env: process.env,
      }).toString();
      return JSON.parse(seedOut);
    } catch {
      if (attempt >= 5) throw new Error('seed-ordnerbaum-screenshots failed');
      execSync(`sleep ${2 + attempt * 2}`);
    }
  }
  throw new Error('seed-ordnerbaum-screenshots failed');
}

async function addSession(context, authCookie) {
  const value = authCookie.includes('=') ? authCookie.split('=').slice(1).join('=') : authCookie;
  await context.addCookies([
    {
      name: 'better-auth.session_token',
      value: decodeURIComponent(value),
      domain: BASE_HOST,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function prepareTree(page, direktFolderId) {
  await page.goto(`${BASE}/filesystem`, { waitUntil: 'domcontentloaded' });
  await page.locator('.dateisystem-shell').waitFor({ state: 'visible', timeout: 45_000 });
  await page.locator('a.sidebar-mappe-link.dateisystem-tree-link', { hasText: 'EHW+' }).click();
  await page.waitForURL(/\/filesystem\/containers\//, { timeout: 20_000 });
  const direktLink = page.locator('a.dateisystem-tree-link', { hasText: /^Direkt$/ });
  if ((await direktLink.count()) === 0) {
    const mappeRow = page.locator('.dateisystem-tree-row').filter({
      has: page.locator('a.sidebar-mappe-link', { hasText: 'EHW+' }),
    });
    await mappeRow.locator('button.dateisystem-tree-chevron').click();
  }
  await direktLink.waitFor({ state: 'visible', timeout: 15_000 });
  await direktLink.click();
  await page.waitForURL(new RegExp(`/filesystem/folders/${direktFolderId}`), { timeout: 15_000 });
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log('wrote', file);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const { authCookie, direktFolderId } = refreshSeed();
  const browser = await chromium.launch({ headless: true });

  for (const spec of [
    { name: 'ordnerbaum-de-light-1440.png', locale: 'de-DE', lang: 'de', theme: 'light', width: 1440 },
    { name: 'ordnerbaum-de-light-1024.png', locale: 'de-DE', lang: 'de', theme: 'light', width: 1024 },
    {
      name: 'ordnerbaum-de-light-1024-hover.png',
      locale: 'de-DE',
      lang: 'de',
      theme: 'light',
      width: 1024,
      hoverLongName: true,
    },
    { name: 'ordnerbaum-en-dark-1440.png', locale: 'en-US', lang: 'en', theme: 'dark', width: 1440 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: spec.width, height: 900 },
      locale: spec.locale,
      colorScheme: spec.theme,
    });
    await addSession(context, authCookie);
    const page = await context.newPage();
    await page.addInitScript(({ lng, theme }) => {
      window.localStorage.setItem('i18nextLng', lng);
      window.localStorage.setItem('docuvate-theme', theme);
    }, { lng: spec.lang, theme: spec.theme });
    await prepareTree(page, direktFolderId);
    if (spec.hoverLongName) {
      const longName = page.locator('.sidebar-tree-name', { hasText: 'Sehr langer Ordnername' });
      if ((await longName.count()) === 0) {
        const mappeRow = page.locator('.dateisystem-tree-row').filter({
          has: page.locator('a.sidebar-mappe-link', { hasText: 'EHW+' }),
        });
        await mappeRow.locator('button.dateisystem-tree-chevron').click();
      }
      await longName.first().waitFor({ state: 'visible', timeout: 15_000 });
      await longName.first().hover();
    }
    await shot(page, spec.name);
    await context.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
