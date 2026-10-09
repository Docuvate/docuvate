import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.env.ARTIFACTS_DIR ?? join(process.cwd(), 'tmp', 'site-shots');
mkdirSync(outDir, { recursive: true });

const base = process.env.E2E_SITE_URL ?? 'http://127.0.0.1:8081';

async function newPreparedPage(browser, { width, height, theme, locale = 'de' }) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.addInitScript((prefs) => {
    localStorage.setItem('docuvate-site-theme', prefs.theme);
    localStorage.setItem('docuvate-site-locale', prefs.locale);
    document.documentElement.setAttribute('data-docuvate-theme', prefs.theme);
  }, { theme, locale });
  return { context, page };
}

async function gotoAndSettle(page, path) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForTimeout(600);
}

async function waitForHashSectionSettled(page, requestedHash) {
  await page.waitForFunction(
    (hash) => {
      const w = window;
      const store = w.__dvScrollStable ?? { y: w.scrollY, since: performance.now() };
      if (Math.abs(w.scrollY - store.y) > 0.5) {
        w.__dvScrollStable = { y: w.scrollY, since: performance.now() };
        return false;
      }
      if (performance.now() - store.since < 500) {
        w.__dvScrollStable = store;
        return false;
      }
      if (location.hash !== hash) return false;
      const id = decodeURIComponent(hash.slice(1));
      const section = document.getElementById(id);
      if (!section) return false;
      const hb = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
      const heading =
        section.querySelector('h1, h2, h3, h4, .section-header, .section-header-label') ?? section;
      const top = heading.getBoundingClientRect().top;
      return top >= hb - 1 && top <= hb + 24;
    },
    requestedHash,
    { timeout: 35_000 },
  );
  await page.waitForTimeout(400);
}

const browser = await chromium.launch();
const customFieldsHash = '#tag/labels/PUT/tags/{tagId}/custom-fields';

for (const theme of ['light', 'dark']) {
  const { context, page } = await newPreparedPage(browser, { width: 1280, height: 800, theme });
  await gotoAndSettle(page, `/docs/api${customFieldsHash}`);
  await page.waitForSelector('.scalar-embed', { state: 'attached', timeout: 60_000 });
  await waitForHashSectionSettled(page, customFieldsHash);
  const title = await page.locator('.scalar-embed-locale-de').innerText();
  if (!title.includes('Benutzerdefinierte Felder speichern')) {
    throw new Error('Operation screenshot missing German operation title');
  }
  await page.screenshot({ path: join(outDir, `api-operation-open-1280-${theme}.png`) });
  await context.close();
}

{
  const { context, page } = await newPreparedPage(browser, { width: 1280, height: 800, theme: 'light' });
  await gotoAndSettle(page, '/docs/api#tag/labels');
  await page.waitForSelector('.scalar-embed nav.sidebar-pages', { state: 'attached', timeout: 60_000 });
  await waitForHashSectionSettled(page, '#tag/labels');
  await page
    .locator('.scalar-embed nav.sidebar-pages li.sidebar-group-item')
    .filter({ hasText: 'Dokumente' })
    .locator('button[aria-expanded]')
    .first()
    .click();
  await page.waitForTimeout(400);
  await page
    .locator('.scalar-embed nav.sidebar-pages li.sidebar-group-item')
    .filter({ hasText: 'Labels' })
    .locator('button[aria-expanded]')
    .first()
    .click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, 'api-sidebar-accordion-labels-1280.png') });
  await context.close();
}

{
  const adminHash = '#tag/benutzerverwaltung/GET/admin/users';
  const { context, page } = await newPreparedPage(browser, { width: 1280, height: 800, theme: 'light' });
  await gotoAndSettle(page, `/docs/api${adminHash}`);
  await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
  await waitForHashSectionSettled(page, adminHash);
  await page.mouse.move(900, 400);
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(outDir, 'api-deeplink-admin-users-1280.png') });
  await context.close();
}

for (const [file, hash] of [
  ['api-deeplink-einladungen-footer-1280', '#tag/dokumente'],
  ['api-deeplink-korrespondenten-1280', '#tag/korrespondenten'],
  ['api-deeplink-post-documents-1280', '#tag/dokumente/POST/documents'],
]) {
  const { context, page } = await newPreparedPage(browser, { width: 1280, height: 800, theme: 'light' });
  await gotoAndSettle(page, `/docs/api${hash}`);
  await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
  await waitForHashSectionSettled(page, hash);
  if (file === 'api-deeplink-einladungen-footer-1280') {
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('End');
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: join(outDir, `${file}.png`) });
  await context.close();
}

{
  const { context, page } = await newPreparedPage(browser, { width: 1280, height: 800, theme: 'light' });
  await gotoAndSettle(page, '/docs/api');
  await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
  for (let i = 0; i < 35; i += 1) {
    await page.keyboard.press('End');
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, 'api-scrolled-erweiterungen-footer-1280.png') });
  await context.close();
}

{
  const { context, page } = await newPreparedPage(browser, { width: 1280, height: 900, theme: 'light' });
  await gotoAndSettle(page, `/docs/api${customFieldsHash}`);
  await page.waitForSelector('.scalar-embed button.tab', { state: 'attached', timeout: 60_000 });
  await waitForHashSectionSettled(page, customFieldsHash);
  const sectionId = decodeURIComponent(customFieldsHash.slice(1));
  const opSection = page.locator(`[id="${sectionId.replace(/"/g, '\\"')}"]`);
  const tab200 = opSection.locator('button.tab').filter({ hasText: /Status:\s*200/ });
  await tab200.waitFor({ state: 'visible', timeout: 30_000 });
  await tab200.focus();
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(outDir, 'api-operation-status-tabs-1280.png') });
  await context.close();
}

{
  const { context, page } = await newPreparedPage(browser, { width: 1280, height: 900, theme: 'light' });
  await gotoAndSettle(page, `/docs/api${customFieldsHash}`);
  await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
  await waitForHashSectionSettled(page, customFieldsHash);
  const toggle = page
    .locator('.scalar-embed button.schema-card-title')
    .filter({ hasText: 'Unterattribute anzeigen' })
    .filter({ visible: true });
  await toggle.first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, 'api-schema-expanded-de-1280.png') });
  await context.close();
}

{
  const { context, page } = await newPreparedPage(browser, { width: 390, height: 844, theme: 'light' });
  await gotoAndSettle(page, '/docs#self-hosting');
  await page.waitForSelector('.env-table-wrap', { timeout: 30_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, 'docs-390-env-table.png') });
  await context.close();
}

{
  const { context, page } = await newPreparedPage(browser, { width: 390, height: 844, theme: 'light' });
  await gotoAndSettle(page, '/docs/sdks');
  await page.locator('.docs-toc-mobile-bar-trigger').click();
  await page.getByRole('button', { name: 'Node.js und TypeScript', exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, 'docs-sdks-390.png') });
  await context.close();
}

for (const theme of ['light', 'dark']) {
  const { context, page } = await newPreparedPage(browser, { width: 1280, height: 800, theme });
  await gotoAndSettle(page, '/');
  await page.screenshot({ path: join(outDir, `landing-hero-1280-${theme}.png`) });
  await context.close();
}

for (const theme of ['light', 'dark']) {
  const { context, page } = await newPreparedPage(browser, { width: 412, height: 924, theme });
  await gotoAndSettle(page, '/');
  await page.locator('.mobile-nav-toggle').click();
  await page.waitForSelector('.mobile-nav-backdrop', { state: 'visible', timeout: 5_000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(outDir, `mobile-menu-open-412-${theme}.png`) });
  await context.close();
}

console.log('Wrote artifacts to', outDir);
await browser.close();
