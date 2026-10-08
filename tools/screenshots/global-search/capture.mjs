#!/usr/bin/env node
import { mkdir, writeFile, unlink, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';

const BASE = process.env.WEB_URL ?? 'http://127.0.0.1:5173';
const OUT = process.env.SCREENSHOT_OUT ?? join(tmpdir(), 'docuvate-screenshots', 'global-search');
const EMAIL = process.env.SEED_EMAIL ?? 'search-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'SearchScreenshot1!';
const HEAD_SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

async function loginContext(context) {
  const res = await fetch(`${process.env.AUTH_BASE ?? 'http://127.0.0.1:3001'}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`sign-in ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookies = setCookie.map((line) => {
    const [pair] = line.split(';');
    const eq = pair.indexOf('=');
    return {
      name: pair.slice(0, eq),
      value: pair.slice(eq + 1),
      url: BASE,
      httpOnly: line.toLowerCase().includes('httponly'),
      sameSite: 'Lax',
    };
  });
  await context.addCookies(cookies);
}

async function shot(page, name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function assertTypoRechnungResults(page) {
  const count = await page.locator('.global-search-did-you-mean, .global-search-did-you-mean-btn').count();
  if (count > 0) {
    throw new Error('did-you-mean UI must not be shown for typo Rehcnung');
  }
  const noResults = await page.locator('.global-search-no-results').count();
  if (noResults > 0) {
    throw new Error('Expected Rehcnung typo hits, got empty state');
  }
  const titles = await page.locator('.global-search-result-title').allTextContents();
  if (!titles.some((t) => /rechnung/i.test(t))) {
    throw new Error(`Expected Rechnung in results for Rehcnung, got: ${JSON.stringify(titles)}`);
  }
}

async function captureSet(page, prefix, locale) {
  const paths = {};
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  paths[`${prefix}-compact`] = await shot(page, `${prefix}-01-compact-header-${locale}.png`);

  await page.locator('.global-search-trigger').click();
  await page.waitForTimeout(200);
  paths[`${prefix}-expanded`] = await shot(page, `${prefix}-02-expanded-header-${locale}.png`);

  await page.keyboard.press('Control+K');
  await page.waitForSelector('.global-search-palette');
  paths[`${prefix}-palette-empty`] = await shot(page, `${prefix}-03-palette-empty-${locale}.png`);

  await page.locator('.global-search-palette-input').fill('Nordwind');
  await page.waitForTimeout(450);
  paths[`${prefix}-grouped`] = await shot(page, `${prefix}-04-grouped-results-${locale}.png`);

  await page.locator('.global-search-palette-input').fill('Rehcnung');
  await page.waitForTimeout(450);
  await assertTypoRechnungResults(page);
  paths[`${prefix}-typo-rechnung`] = await shot(page, `${prefix}-05-results-typo-rechnung-${locale}.png`);

  await page.locator('.global-search-palette-input').fill('Nordwnd');
  await page.waitForTimeout(450);
  paths[`${prefix}-field-nordwnd`] = await shot(page, `${prefix}-06-field-nordwnd-${locale}.png`);

  await page.locator('.global-search-palette-input').fill('absender:nordwnd');
  await page.waitForTimeout(450);
  paths[`${prefix}-filter-absender`] = await shot(page, `${prefix}-07-filter-absender-${locale}.png`);

  await page.locator('.global-search-palette-input').fill('zzqqnoexist');
  await page.waitForTimeout(350);
  paths[`${prefix}-no-results`] = await shot(page, `${prefix}-08-no-results-${locale}.png`);

  await page.keyboard.press('Escape');
  return paths;
}

async function captureGrouped1440Pair(browser, authState) {
  const de = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'de-DE',
    storageState: authState,
  });
  const dePage = await de.newPage();
  await dePage.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  await dePage.keyboard.press('Control+K');
  await dePage.waitForSelector('.global-search-palette-input');
  await dePage.locator('.global-search-palette-input').fill('Nordwind');
  await dePage.waitForTimeout(450);
  const dePath = await shot(dePage, '1440-de-light-04-grouped-results-de-light-1440.png');
  await de.close();

  const enDark = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    colorScheme: 'dark',
    storageState: authState,
  });
  const enPage = await enDark.newPage();
  await enPage.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  await enPage.keyboard.press('Control+K');
  await enPage.waitForSelector('.global-search-palette-input');
  await enPage.locator('.global-search-palette-input').fill('Nordwind');
  await enPage.waitForTimeout(450);
  const enPath = await shot(enPage, '1440-en-dark-04-grouped-results-en-dark-1440.png');
  await enDark.close();
  return {
    '1440-de-light-grouped': dePath,
    '1440-en-dark-grouped': enPath,
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  try {
    const existing = await readdir(OUT);
    await Promise.all(
      existing
        .filter((name) => name.includes('did-you-mean'))
        .map((name) => unlink(join(OUT, name)))
    );
  } catch {
    /* fresh output dir */
  }

  const browser = await chromium.launch();
  const authState = await (async () => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE' });
    await loginContext(ctx);
    return ctx.storageState();
  })();

  if (process.env.CAPTURE_PARTIAL === 'grouped-1440') {
    const partial = await captureGrouped1440Pair(browser, authState);
    await browser.close();
    let manifest = { headSha: HEAD_SHA, baseUrl: BASE, files: {} };
    try {
      manifest = JSON.parse(await readFile(join(OUT, 'manifest.json'), 'utf8'));
    } catch {
      /* new manifest */
    }
    manifest.headSha = HEAD_SHA;
    manifest.baseUrl = BASE;
    Object.assign(manifest.files, partial);
    await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  const paths = { headSha: HEAD_SHA, baseUrl: BASE, files: {} };

  for (const width of [1440, 1024]) {
    const de = await browser.newContext({
      viewport: { width, height: 900 },
      locale: 'de-DE',
      storageState: authState,
    });
    const dePage = await de.newPage();
    Object.assign(paths.files, await captureSet(dePage, `${width}-de-light`, `de-light-${width}`));
    if (width === 1440) {
      await dePage.keyboard.press('Control+K');
      await dePage.waitForSelector('.global-search-palette-input');
      await dePage.locator('.global-search-palette-input').fill('absender:nordwnd');
      await dePage.waitForTimeout(450);
      paths.files['1440-field-typo-absender-nordwnd'] = await shot(
        dePage,
        '1440-de-light-field-typo-absender-nordwnd.png'
      );
      await dePage.locator('.global-search-palette-input').fill('zzqqnoexist');
      await dePage.waitForTimeout(350);
      if ((await dePage.locator('.global-search-no-results').count()) === 0) {
        throw new Error('Expected empty state for gibberish query');
      }
      paths.files['1440-gibberish-empty'] = await shot(dePage, '1440-de-light-gibberish-empty.png');
    }
    await de.close();

    const enDark = await browser.newContext({
      viewport: { width, height: 900 },
      locale: 'en-US',
      colorScheme: 'dark',
      storageState: authState,
    });
    const enPage = await enDark.newPage();
    Object.assign(
      paths.files,
      await captureSet(enPage, `${width}-en-dark`, `en-dark-${width}`)
    );
    await enDark.close();
  }

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'de-DE',
    storageState: authState,
  });
  const mobPage = await mobile.newPage();
  await mobPage.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  await mobPage.waitForSelector('.global-search-mobile-trigger');
  paths.files['390-mobile-trigger'] = await shot(mobPage, '390-de-light-mobile-search-trigger.png');
  await mobPage.locator('.global-search-mobile-trigger').click();
  await mobPage.waitForSelector('.global-search-palette');
  await mobPage.waitForSelector('.global-search-palette-close');
  paths.files['390-sheet'] = await shot(mobPage, '390-de-light-sheet-close.png');
  await mobPage.locator('.global-search-palette-input').fill('Rehcnung');
  await mobPage.waitForTimeout(450);
  await assertTypoRechnungResults(mobPage);
  paths.files['390-results'] = await shot(mobPage, '390-de-light-results-close.png');
  await mobile.close();

  await browser.close();
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(paths, null, 2));
  console.log(JSON.stringify(paths, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
