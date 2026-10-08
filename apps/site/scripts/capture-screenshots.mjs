import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const screenshotDir = join(siteRoot, 'qa-screenshots');
const baseUrl = process.env.SITE_URL ?? 'http://127.0.0.1:8081';
const outDir = process.env.SCREENSHOT_DIR ?? screenshotDir;
const MOBILE_DEVICE_SCALE = 2;
const MOBILE_PARTS = 4;

mkdirSync(outDir, { recursive: true });

function splitMobilePage(baseName) {
  const src = join(outDir, baseName);
  const buf = readFileSync(src);
  const png = PNG.sync.read(buf);
  const partH = Math.ceil(png.height / MOBILE_PARTS);
  const stem = baseName.replace(/\.png$/, '');
  const parts = [];
  for (let y = 0, part = 1; y < png.height; y += partH, part += 1) {
    const h = Math.min(partH, png.height - y);
    const slice = new PNG({ width: png.width, height: h });
    for (let row = 0; row < h; row += 1) {
      png.data.copy(slice.data, row * png.width * 4, ((y + row) * png.width) << 2, ((y + row + 1) * png.width) << 2);
    }
    const outName = `${stem}-part${part}.png`;
    writeFileSync(join(outDir, outName), PNG.sync.write(slice));
    parts.push(outName);
  }
  return parts;
}

function heroAssetSha() {
  const heroPath = join(siteRoot, 'public', 'screenshots', 'library-de-light.png');
  return createHash('sha256').update(readFileSync(heroPath)).digest('hex').slice(0, 12);
}

function rebuildSiteForCapture() {
  const assetSha = heroAssetSha();
  console.log('Building site with VITE_SCREENSHOT_ASSET_SHA=', assetSha);
  const build = spawnSync(
    'pnpm',
    ['--filter', '@docuvate/site', 'build'],
    {
      cwd: join(siteRoot, '..', '..'),
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_SCREENSHOT_ASSET_SHA: assetSha,
      },
    }
  );
  if (build.status !== 0) {
    throw new Error('Site build failed before marketing capture');
  }
  return assetSha;
}

rebuildSiteForCapture();

/** Marketing / QA full-page captures (not embedded in landing). */
const shots = [
  {
    file: 'landing-de-1440-light-atf.png',
    path: '/',
    viewport: { width: 1440, height: 900 },
    locale: 'de',
    theme: 'light',
    fullPage: false,
  },
  {
    file: 'landing-de-1440-dark-atf.png',
    path: '/',
    viewport: { width: 1440, height: 900 },
    locale: 'de',
    theme: 'dark',
    fullPage: false,
  },
  {
    file: 'landing-de-1280-light-atf.png',
    path: '/',
    viewport: { width: 1280, height: 900 },
    locale: 'de',
    theme: 'light',
    fullPage: false,
  },
  {
    file: 'landing-de-1280-dark-atf.png',
    path: '/',
    viewport: { width: 1280, height: 900 },
    locale: 'de',
    theme: 'dark',
    fullPage: false,
  },
  {
    file: 'landing-de-1024-light-atf.png',
    path: '/',
    viewport: { width: 1024, height: 900 },
    locale: 'de',
    theme: 'light',
    fullPage: false,
  },
  {
    file: 'landing-de-1024-dark-atf.png',
    path: '/',
    viewport: { width: 1024, height: 900 },
    locale: 'de',
    theme: 'dark',
    fullPage: false,
  },
  {
    file: 'landing-de-1440-light.png',
    path: '/',
    viewport: { width: 1440, height: 900 },
    locale: 'de',
    theme: 'light',
  },
  {
    file: 'landing-de-1440-dark.png',
    path: '/',
    viewport: { width: 1440, height: 900 },
    locale: 'de',
    theme: 'dark',
  },
  {
    file: 'landing-en-1440-light.png',
    path: '/en',
    viewport: { width: 1440, height: 900 },
    locale: 'en',
    theme: 'light',
  },
  {
    file: 'landing-en-1440-dark.png',
    path: '/en',
    viewport: { width: 1440, height: 900 },
    locale: 'en',
    theme: 'dark',
  },
  {
    file: 'landing-de-390-light.png',
    path: '/',
    viewport: { width: 390, height: 844 },
    locale: 'de',
    theme: 'light',
    closeMobileMenu: true,
  },
  {
    file: 'landing-de-390-dark.png',
    path: '/',
    viewport: { width: 390, height: 844 },
    locale: 'de',
    theme: 'dark',
    closeMobileMenu: true,
  },
  {
    file: 'landing-en-390-light.png',
    path: '/en',
    viewport: { width: 390, height: 844 },
    locale: 'en',
    theme: 'light',
    closeMobileMenu: true,
  },
  {
    file: 'landing-en-390-dark.png',
    path: '/en',
    viewport: { width: 390, height: 844 },
    locale: 'en',
    theme: 'dark',
    closeMobileMenu: true,
  },
  {
    file: 'impressum-de-1440-light.png',
    path: '/impressum',
    viewport: { width: 1440, height: 900 },
    locale: 'de',
    theme: 'light',
  },
  {
    file: 'impressum-de-1440-dark.png',
    path: '/impressum',
    viewport: { width: 1440, height: 900 },
    locale: 'de',
    theme: 'dark',
  },
  {
    file: 'datenschutz-de-1440-light.png',
    path: '/datenschutz',
    viewport: { width: 1440, height: 900 },
    locale: 'de',
    theme: 'light',
  },
  {
    file: 'legal-en-1440-light.png',
    path: '/en/impressum',
    viewport: { width: 1440, height: 900 },
    locale: 'en',
    theme: 'light',
  },
  {
    file: 'landing-de-faq-open-light.png',
    path: '/',
    viewport: { width: 1440, height: 900 },
    locale: 'de',
    theme: 'light',
    fullPage: false,
    openFirstFaq: true,
    clipSelector: '.landing-faq-section',
  },
  {
    file: 'docs-de-1440-light.png',
    path: '/docs',
    viewport: { width: 1440, height: 900 },
    locale: 'de',
    theme: 'light',
  },
  {
    file: 'docs-api-de-1440-light.png',
    path: '/docs/api',
    viewport: { width: 1440, height: 900 },
    locale: 'de',
    theme: 'light',
  },
  {
    file: 'docs-sdks-de-1440-light.png',
    path: '/docs/sdks',
    viewport: { width: 1440, height: 900 },
    locale: 'de',
    theme: 'light',
  },
];

function siteInitScript(locale, theme) {
  return `(() => {
    localStorage.setItem('docuvate-site-theme', ${JSON.stringify(theme)});
    document.documentElement.setAttribute('data-docuvate-theme', ${JSON.stringify(theme)});
    localStorage.setItem('docuvate-site-locale', ${JSON.stringify(locale)});
  })();`;
}

async function ensureMobileMenuClosed(page) {
  const toggle = page.locator('.mobile-nav-toggle');
  if (await toggle.getAttribute('aria-expanded') === 'true') {
    await toggle.click();
  }
  await page.evaluate(() => {
    const dialog = document.getElementById('mobile-nav-panel');
    if (dialog instanceof HTMLDialogElement && dialog.open) {
      dialog.close();
    }
  });
  await page.waitForTimeout(150);
}

async function verifyLandingProductCardAsset(page) {
  const heroSrc = await page.locator('.landing-product-card-img').first().getAttribute('src');
  if (!heroSrc) {
    throw new Error('Landing product card img missing');
  }
  const url = new URL(heroSrc, baseUrl);
  const res = await page.request.get(url.toString());
  if (!res.ok()) {
    throw new Error(`Product card asset fetch failed: ${res.status()} ${url}`);
  }
  const servedHash = createHash('sha256').update(await res.body()).digest('hex');
  const fileHash = createHash('sha256')
    .update(readFileSync(join(screenshotDir, 'library-de-light.png')))
    .digest('hex');
  if (servedHash !== fileHash) {
    throw new Error(
      `Landing library PNG mismatch (served ${servedHash.slice(0, 12)} vs file ${fileHash.slice(0, 12)})`
    );
  }
  console.log('Verified landing product card matches library-de-light.png');
}

const browser = await chromium.launch();
for (const shot of shots) {
  const isMobile = shot.viewport.width <= 390;
  const context = await browser.newContext({
    viewport: shot.viewport,
    deviceScaleFactor: isMobile ? MOBILE_DEVICE_SCALE : 1,
    colorScheme: shot.theme,
    locale: shot.locale === 'de' ? 'de-DE' : 'en-US',
    bypassCSP: true,
  });
  await context.addInitScript(siteInitScript(shot.locale, shot.theme));
  const page = await context.newPage();
  await page.goto(`${baseUrl}${shot.path}`, { waitUntil: 'networkidle', timeout: 120_000 });
  await ensureMobileMenuClosed(page);
  if (shot.closeMobileMenu) {
    await page.waitForTimeout(200);
  }
  if (shot.path.includes('/docs/api')) {
    await page.waitForTimeout(4000);
  }
  if (shot.file === 'landing-de-1440-light-atf.png') {
    await verifyLandingProductCardAsset(page);
  }
  if (shot.openFirstFaq) {
    await page.locator('.faq-item').first().evaluate((el) => {
      el.setAttribute('open', '');
    });
    await page.waitForTimeout(200);
  }
  if (shot.clipSelector) {
    const section = page.locator(shot.clipSelector);
    await section.screenshot({ path: join(outDir, shot.file) });
  } else {
    await page.screenshot({
      path: join(outDir, shot.file),
      fullPage: shot.fullPage !== false,
    });
  }
  await context.close();
  console.log('Wrote', join(outDir, shot.file));
}

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
  await page.locator('.mobile-nav-toggle').click();
  await page.waitForSelector('#mobile-nav-panel[open]', { timeout: 5000 });
  await page.waitForTimeout(250);
  await page.screenshot({
    path: join(outDir, menuShot.file),
    fullPage: false,
  });
  await context.close();
  console.log('Wrote', join(outDir, menuShot.file));
}
// Alias for docs/scripts
await import('node:fs/promises').then(({ copyFile }) =>
  copyFile(
    join(outDir, 'landing-de-390-mobile-menu-light.png'),
    join(outDir, 'landing-de-390-mobile-menu.png')
  )
);
console.log('Wrote', join(outDir, 'landing-de-390-mobile-menu.png'), '(alias)');

for (const mobile of [
  'landing-de-390-light.png',
  'landing-de-390-dark.png',
  'landing-en-390-light.png',
  'landing-en-390-dark.png',
]) {
  const p = join(outDir, mobile);
  try {
    readFileSync(p);
    const parts = splitMobilePage(mobile);
    console.log('Split', mobile, '→', parts.join(', '));
  } catch {
    console.warn('Skip mobile split (missing)', mobile);
  }
}

await browser.close();
