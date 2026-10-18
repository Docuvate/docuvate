import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(siteRoot, 'qa-screenshots');
const baseUrl = process.env.SITE_URL ?? 'http://127.0.0.1:8081';
const MOBILE_PARTS = 4;

mkdirSync(outDir, { recursive: true });

function siteInitScript(locale, theme) {
  return `(() => {
    localStorage.setItem('docuvate-site-theme', ${JSON.stringify(theme)});
    document.documentElement.setAttribute('data-docuvate-theme', ${JSON.stringify(theme)});
    localStorage.setItem('docuvate-site-locale', ${JSON.stringify(locale)});
  })();`;
}

function splitMobilePage(baseName) {
  const src = join(outDir, baseName);
  const buf = readFileSync(src);
  const png = PNG.sync.read(buf);
  const partH = Math.ceil(png.height / MOBILE_PARTS);
  const stem = baseName.replace(/\.png$/, '');
  for (let y = 0, part = 1; y < png.height; y += partH, part += 1) {
    const h = Math.min(partH, png.height - y);
    const slice = new PNG({ width: png.width, height: h });
    for (let row = 0; row < h; row += 1) {
      png.data.copy(slice.data, row * png.width * 4, ((y + row) * png.width) << 2, ((y + row + 1) * png.width) << 2);
    }
    writeFileSync(join(outDir, `${stem}-part${part}.png`), PNG.sync.write(slice));
  }
}

const shots = [
  { file: 'landing-de-1440-light.png', path: '/', locale: 'de', theme: 'light', viewport: { width: 1440, height: 900 } },
  { file: 'landing-de-1440-dark.png', path: '/', locale: 'de', theme: 'dark', viewport: { width: 1440, height: 900 } },
  { file: 'landing-de-390-light.png', path: '/', locale: 'de', theme: 'light', viewport: { width: 390, height: 844 }, mobile: true },
  { file: 'impressum-de-1440-light.png', path: '/impressum', locale: 'de', theme: 'light', viewport: { width: 1440, height: 900 } },
  { file: 'impressum-de-1440-dark.png', path: '/impressum', locale: 'de', theme: 'dark', viewport: { width: 1440, height: 900 } },
  { file: 'datenschutz-de-1440-light.png', path: '/datenschutz', locale: 'de', theme: 'light', viewport: { width: 1440, height: 900 } },
  { file: 'legal-en-1440-light.png', path: '/en/impressum', locale: 'en', theme: 'light', viewport: { width: 1440, height: 900 } },
];

const browser = await chromium.launch();
for (const shot of shots) {
  const context = await browser.newContext({
    viewport: shot.viewport,
    deviceScaleFactor: shot.mobile ? 2 : 1,
    colorScheme: shot.theme,
    locale: shot.locale === 'de' ? 'de-DE' : 'en-US',
  });
  await context.addInitScript(siteInitScript(shot.locale, shot.theme));
  const page = await context.newPage();
  await page.goto(`${baseUrl}${shot.path}`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.screenshot({ path: join(outDir, shot.file), fullPage: true });
  await context.close();
  console.log('Wrote', shot.file);
}
await browser.close();
splitMobilePage('landing-de-390-light.png');
console.log('R8 captures done');
