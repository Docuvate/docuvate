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
  { file: 'impressum-de-1440-light.png', path: '/impressum', locale: 'de', theme: 'light' },
  { file: 'impressum-de-1440-dark.png', path: '/impressum', locale: 'de', theme: 'dark' },
  { file: 'datenschutz-de-1440-light.png', path: '/datenschutz', locale: 'de', theme: 'light' },
  { file: 'legal-en-1440-dark.png', path: '/en/impressum', locale: 'en', theme: 'dark' },
  {
    file: 'landing-de-1440-light-part1.png',
    path: '/',
    locale: 'de',
    theme: 'light',
    clipSelector: null,
    viewportHeight: 1600,
  },
];

const browser = await chromium.launch();
for (const shot of shots) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: shot.viewportHeight ?? 900 },
    colorScheme: shot.theme,
    locale: shot.locale === 'de' ? 'de-DE' : 'en-US',
  });
  await context.addInitScript(siteInitScript(shot.locale, shot.theme));
  const page = await context.newPage();
  await page.goto(`${baseUrl}${shot.path}`, { waitUntil: 'networkidle', timeout: 120_000 });
  if (shot.file === 'landing-de-1440-light-part1.png') {
    await page.screenshot({
      path: join(outDir, shot.file),
      fullPage: false,
      clip: { x: 0, y: 0, width: 1440, height: 1600 },
    });
  } else {
    await page.screenshot({ path: join(outDir, shot.file), fullPage: true });
  }
  await context.close();
  console.log('Wrote', shot.file);
}
await browser.close();
