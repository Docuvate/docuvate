import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(siteRoot, 'qa-screenshots');
const baseUrl = process.env.SITE_URL ?? 'http://127.0.0.1:8081';
const outFile = 'docs-api-de-1440-light-download-link-r15.png';

mkdirSync(outDir, { recursive: true });

function stitchHorizontal(leftPath, rightPath, destPath) {
  const left = PNG.sync.read(readFileSync(leftPath));
  const right = PNG.sync.read(readFileSync(rightPath));
  const height = Math.max(left.height, right.height);
  const out = new PNG({ width: left.width + right.width, height });
  PNG.bitblt(left, out, 0, 0, left.width, left.height, 0, 0);
  PNG.bitblt(right, out, 0, 0, right.width, right.height, left.width, 0);
  writeFileSync(destPath, PNG.sync.write(out));
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'de-DE',
  colorScheme: 'light',
});
await context.addInitScript(() => {
  localStorage.setItem('docuvate-site-theme', 'light');
  localStorage.setItem('docuvate-site-locale', 'de');
  document.documentElement.setAttribute('data-docuvate-theme', 'light');
});
const page = await context.newPage();
await page.goto(`${baseUrl}/docs/api`, { waitUntil: 'networkidle', timeout: 120_000 });
await page.waitForSelector('.scalar-embed-locale-de .download-button', { timeout: 60_000 });
const link = page.locator('.scalar-embed-locale-de .download-button').first();
await link.scrollIntoViewIfNeeded();

const clip = await link.evaluate((el) => {
  const pad = 12;
  const r = el.getBoundingClientRect();
  return {
    x: Math.max(0, r.x - pad),
    y: Math.max(0, r.y - pad),
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
});

const normalPath = join(outDir, '_r15-download-normal.png');
const hoverPath = join(outDir, '_r15-download-hover.png');
await page.screenshot({ path: normalPath, clip });
await link.hover();
await page.waitForTimeout(200);
await page.screenshot({ path: hoverPath, clip });
stitchHorizontal(normalPath, hoverPath, join(outDir, outFile));
console.log('Wrote', outFile);
await browser.close();
