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
  { file: 'docs-api-de-1440-light.png', path: '/docs/api', locale: 'de', theme: 'light' },
  { file: 'docs-api-de-1440-dark.png', path: '/docs/api', locale: 'de', theme: 'dark' },
];

const browser = await chromium.launch();
for (const shot of shots) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: shot.theme,
    locale: shot.locale === 'de' ? 'de-DE' : 'en-US',
  });
  await context.addInitScript(siteInitScript(shot.locale, shot.theme));
  const page = await context.newPage();
  await page.goto(`${baseUrl}${shot.path}`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForSelector('.scalar-app, .scalar-embed', { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(outDir, shot.file), fullPage: false });
  await context.close();
  console.log('Wrote', shot.file);
}
await browser.close();
