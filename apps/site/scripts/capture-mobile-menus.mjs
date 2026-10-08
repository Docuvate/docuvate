import { chromium } from 'playwright';
import { copyFileSync, mkdirSync } from 'node:fs';
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

async function ensureMobileMenuClosed(page) {
  const toggle = page.locator('.mobile-nav-toggle');
  if ((await toggle.getAttribute('aria-expanded')) === 'true') {
    await toggle.click();
  }
  await page.evaluate(() => {
    const dialog = document.getElementById('mobile-nav-panel');
    if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
  });
  await page.waitForTimeout(150);
}

const browser = await chromium.launch();
for (const menuShot of [
  { file: 'landing-de-390-mobile-menu-light.png', theme: 'light' },
  { file: 'landing-de-390-mobile-menu-dark.png', theme: 'dark' },
]) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: menuShot.theme,
    locale: 'de-DE',
  });
  await context.addInitScript(siteInitScript('de', menuShot.theme));
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle', timeout: 120_000 });
  await ensureMobileMenuClosed(page);
  const panelStyles = await page.evaluate(() => {
    const panel = document.querySelector('.mobile-nav-panel-on-hero');
    const link = document.querySelector('.mobile-nav-panel-on-hero a');
    if (!panel || !link) return null;
    const ps = getComputedStyle(panel);
    const ls = getComputedStyle(link);
    return { panelBg: ps.backgroundColor, linkColor: ls.color, linkContrast: ls.color };
  });
  console.log(menuShot.theme, panelStyles);
  await page.locator('.mobile-nav-toggle').click();
  await page.waitForSelector('#mobile-nav-panel[open]', { timeout: 5000 });
  await page.waitForTimeout(300);
  const path = join(outDir, menuShot.file);
  await page.screenshot({ path, fullPage: false });
  const dims = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  console.log('Wrote', path, dims);
  await context.close();
}
await browser.close();
copyFileSync(
  join(outDir, 'landing-de-390-mobile-menu-light.png'),
  join(outDir, 'landing-de-390-mobile-menu.png')
);
