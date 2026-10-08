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

const shots = [
  { file: 'docs-api-de-1440-light.png', viewport: { width: 1440, height: 900 }, theme: 'light' },
  { file: 'docs-api-de-1440-dark.png', viewport: { width: 1440, height: 900 }, theme: 'dark' },
  { file: 'docs-api-de-390-light.png', viewport: { width: 390, height: 844 }, theme: 'light', mobile: true },
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
  await page.goto(`${baseUrl}/docs/api`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForSelector('.scalar-app', { timeout: 60_000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(outDir, shot.file), fullPage: false });
  await context.close();
  console.log('Wrote', shot.file);
}
await browser.close();
