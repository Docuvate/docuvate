import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(siteRoot, 'qa-screenshots');
const baseUrl = process.env.SITE_URL ?? 'http://127.0.0.1:8081';

mkdirSync(outDir, { recursive: true });

function siteInitScript(locale, theme) {
  return `(() => {
    localStorage.setItem('docuvate-site-theme', ${JSON.stringify(theme)});
    document.documentElement.setAttribute('data-docuvate-theme', ${JSON.stringify(theme)});
    localStorage.setItem('docuvate-site-locale', ${JSON.stringify(locale)});
  })();`;
}

async function closeSiteMobileNav(page) {
  await page.evaluate(() => {
    const dialog = document.getElementById('mobile-nav-panel');
    if (dialog instanceof HTMLDialogElement && dialog.open) {
      dialog.close();
    }
  });
  const toggle = page.locator('.mobile-nav-toggle');
  if (await toggle.count()) {
    const expanded = await toggle.getAttribute('aria-expanded');
    if (expanded === 'true') {
      await toggle.click();
    }
  }
}

async function scrollBelowHeader(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const header = document.querySelector('.site-header');
    const offset = (header?.getBoundingClientRect().height ?? 64) + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }, selector);
  await page.waitForTimeout(400);
}

/** @type {Array<{ file: string; path: string; viewport: { width: number; height: number }; theme: 'light' | 'dark'; mobile?: boolean; openNav?: boolean; scrollTo?: string; waitFor?: string; clipHeader?: boolean; clickAnchor?: string }>} */
const shots = [
  { file: 'landing-de-1440-light.png', path: '/', viewport: { width: 1440, height: 900 }, theme: 'light', waitFor: '.landing-hero-title' },
  { file: 'landing-de-1440-dark.png', path: '/', viewport: { width: 1440, height: 900 }, theme: 'dark', waitFor: '.landing-hero-title' },
  { file: 'landing-de-390-light.png', path: '/', viewport: { width: 390, height: 844 }, theme: 'light', mobile: true, waitFor: '.landing-hero-title' },
  { file: 'landing-de-390-dark.png', path: '/', viewport: { width: 390, height: 844 }, theme: 'dark', mobile: true, waitFor: '.landing-hero-title' },
  {
    file: 'landing-de-390-light-mobile-menu.png',
    path: '/',
    viewport: { width: 390, height: 844 },
    theme: 'light',
    mobile: true,
    openNav: true,
    waitFor: '.landing-hero-title',
  },
  {
    file: 'landing-de-390-light-mobile-menu-closed.png',
    path: '/docs',
    viewport: { width: 390, height: 844 },
    theme: 'light',
    mobile: true,
    waitFor: '.site-brand-logo',
  },
  {
    file: 'landing-de-integrations-1440-light.png',
    path: '/',
    viewport: { width: 1440, height: 900 },
    theme: 'light',
    scrollTo: '#integrations-heading',
    waitFor: '#integrations-heading',
  },
  {
    file: 'landing-de-integrations-1440-dark.png',
    path: '/',
    viewport: { width: 1440, height: 900 },
    theme: 'dark',
    scrollTo: '#integrations-heading',
    waitFor: '#integrations-heading',
  },
  {
    file: 'landing-de-anchor-feature-chat-1440-light.png',
    path: '/',
    viewport: { width: 1440, height: 900 },
    theme: 'light',
    clickAnchor: 'a[href="/#feature-chat"]',
    waitFor: '#feature-chat',
  },
  {
    file: 'docs-de-1440-light-toc.png',
    path: '/docs',
    viewport: { width: 1440, height: 900 },
    theme: 'light',
    waitFor: '.docs-toc-desktop',
  },
  {
    file: 'docs-nav-de-1440-light.png',
    path: '/docs',
    viewport: { width: 1440, height: 900 },
    theme: 'light',
    waitFor: '.docs-sidebar',
  },
  {
    file: 'docs-sdks-de-1440-light.png',
    path: '/docs/sdks',
    viewport: { width: 1440, height: 900 },
    theme: 'light',
    waitFor: '.code-panel',
  },
  { file: 'docs-api-de-1440-light.png', path: '/docs/api', viewport: { width: 1440, height: 900 }, theme: 'light', waitFor: '.scalar-app' },
  { file: 'docs-api-de-1440-dark.png', path: '/docs/api', viewport: { width: 1440, height: 900 }, theme: 'dark', waitFor: '.scalar-app' },
  {
    file: 'docs-api-de-390-light.png',
    path: '/docs/api',
    viewport: { width: 390, height: 844 },
    theme: 'light',
    mobile: true,
    waitFor: '.scalar-app',
  },
  {
    file: 'docs-api-de-390-light-mobile-menu.png',
    path: '/docs/api',
    viewport: { width: 390, height: 844 },
    theme: 'light',
    mobile: true,
    openNav: true,
    waitFor: '.scalar-app',
  },
  {
    file: 'site-header-de-1440-light.png',
    path: '/docs',
    viewport: { width: 1440, height: 900 },
    theme: 'light',
    waitFor: '.site-brand-logo',
    clipHeader: true,
  },
  {
    file: 'site-header-de-1440-dark.png',
    path: '/docs',
    viewport: { width: 1440, height: 900 },
    theme: 'dark',
    waitFor: '.site-brand-logo',
    clipHeader: true,
  },
  {
    file: 'site-header-de-390-light.png',
    path: '/docs',
    viewport: { width: 390, height: 844 },
    theme: 'light',
    mobile: true,
    waitFor: '.site-brand-logo',
    clipHeader: true,
  },
  {
    file: 'site-header-de-390-dark.png',
    path: '/docs',
    viewport: { width: 390, height: 844 },
    theme: 'dark',
    mobile: true,
    waitFor: '.site-brand-logo',
    clipHeader: true,
  },
];

const browser = await chromium.launch();
for (const shot of shots) {
  const context = await browser.newContext({
    viewport: shot.viewport,
    deviceScaleFactor: shot.mobile ? 2 : 1,
    colorScheme: shot.theme,
    locale: 'de-DE',
  });
  await context.addInitScript(siteInitScript('de', shot.theme));
  const page = await context.newPage();
  await page.goto(`${baseUrl}${shot.path}`, { waitUntil: 'networkidle', timeout: 120_000 });
  if (shot.waitFor) {
    await page.waitForSelector(shot.waitFor, { timeout: 60_000 });
  }
  await closeSiteMobileNav(page);
  if (shot.clickAnchor) {
    await page.locator(shot.clickAnchor).first().click();
    await page.waitForTimeout(500);
    if (shot.waitFor) {
      await scrollBelowHeader(page, shot.waitFor.startsWith('#') ? shot.waitFor : `#${shot.waitFor}`);
    }
  }
  if (shot.openNav) {
    await page.locator('.mobile-nav-toggle').click();
    await page.waitForTimeout(300);
  }
  if (shot.scrollTo) {
    await scrollBelowHeader(page, shot.scrollTo);
  }
  await page.waitForTimeout(800);
  if (shot.clipHeader) {
    await page.locator('.site-header').screenshot({ path: join(outDir, shot.file) });
  } else {
    await page.screenshot({ path: join(outDir, shot.file), fullPage: false });
  }
  await context.close();
  console.log('Wrote', shot.file);
}
await browser.close();
