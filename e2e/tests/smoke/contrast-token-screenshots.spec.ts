import fs from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  applyContrastLocale,
  applyContrastTheme,
  assertContrastTheme,
  resolveSmokeReadyDocumentPath,
  routePathForSlug,
  waitForContrastPageReady,
  type ContrastLocale,
  type ContrastTheme,
} from '../../helpers/contrast-screenshot';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

const ALL_VIEWPORTS = [
  { label: '1440', width: 1440, height: 900 },
  { label: '390', width: 390, height: 844 },
] as const;

const REVIEW_VIEWPORTS = [{ label: '1440', width: 1440, height: 900 }] as const;

function viewportsForRun(): typeof ALL_VIEWPORTS | typeof REVIEW_VIEWPORTS {
  return process.env['CONTRAST_SCREENSHOT_REVIEW_ONLY'] === '1' ? REVIEW_VIEWPORTS : ALL_VIEWPORTS;
}

const THEMES: ContrastTheme[] = ['light', 'dark'];

const AUTHENTICATED_CAPTURES: { slug: string; locale: ContrastLocale }[] = [
  { slug: 'dashboard', locale: 'en' },
  { slug: 'documents', locale: 'en' },
  { slug: 'documents-de', locale: 'de' },
  { slug: 'settings', locale: 'en' },
  { slug: 'labels', locale: 'en' },
  { slug: 'connectors', locale: 'en' },
  { slug: 'filesystem', locale: 'en' },
  { slug: 'document-detail', locale: 'en' },
  { slug: 'document-detail-de', locale: 'de' },
];

const REVIEW_CAPTURE_SLUGS = new Set([
  'documents',
  'documents-de',
  'labels',
  'connectors',
  'filesystem',
  'document-detail',
  'document-detail-de',
]);

function capturesForRun(): { slug: string; locale: ContrastLocale }[] {
  if (process.env['CONTRAST_SCREENSHOT_REVIEW_ONLY'] === '1') {
    return AUTHENTICATED_CAPTURES.filter((row) => REVIEW_CAPTURE_SLUGS.has(row.slug));
  }
  return AUTHENTICATED_CAPTURES;
}

type ManifestEntry = {
  file: string;
  phase: string;
  theme: string;
  width: string;
  slug: string;
  locale: ContrastLocale;
};

function artifactBase(): string {
  return process.env['CONTRAST_SCREENSHOT_DIR'] ?? path.join(process.cwd(), 'contrast-screenshots');
}

function artifactRoot(): string {
  const phase = process.env['CONTRAST_SCREENSHOT_PHASE'] ?? 'after';
  return path.join(artifactBase(), phase);
}

async function writeManifest(entries: ManifestEntry[]): Promise<void> {
  const manifestPath = path.join(artifactBase(), 'manifest.json');
  let merged = entries;
  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    const parsed: { captures?: ManifestEntry[] } = JSON.parse(raw);
    const existing = parsed.captures ?? [];
    const byKey = new Map<string, ManifestEntry>();
    for (const row of [...existing, ...entries]) {
      byKey.set(`${row.phase}/${row.theme}/${row.width}/${row.slug}`, row);
    }
    merged = [...byKey.values()];
  } catch {
    merged = entries;
  }
  const sorted = [...merged].sort((a, b) =>
    `${a.phase}/${a.theme}/${a.width}/${a.slug}`.localeCompare(
      `${b.phase}/${b.theme}/${b.width}/${b.slug}`
    )
  );
  await fs.writeFile(manifestPath, `${JSON.stringify({ captures: sorted }, null, 2)}\n`, 'utf8');
}

test.describe('Contrast workstream screenshots', () => {
  test.describe.configure({ mode: 'serial' });

  const manifest: ManifestEntry[] = [];
  const phase = process.env['CONTRAST_SCREENSHOT_PHASE'] ?? 'after';

  test.afterAll(async () => {
    if (manifest.length > 0) {
      await writeManifest(manifest);
    }
  });

  async function captureShot(
    page: import('@playwright/test').Page,
    slug: string,
    locale: ContrastLocale,
    theme: ContrastTheme,
    viewportLabel: string,
    documentDetailPath: string
  ): Promise<string> {
    const routePath = routePathForSlug(slug, documentDetailPath);

    await page.goto(`${webOrigin}/`, { waitUntil: 'domcontentloaded' });
    await applyContrastLocale(page, locale);
    await applyContrastTheme(page, theme);

    await page.goto(`${webOrigin}${routePath}`, { waitUntil: 'domcontentloaded' });
    await waitForContrastPageReady(page, slug, documentDetailPath, webOrigin);
    await applyContrastTheme(page, theme);
    await assertContrastTheme(page, theme);

    const dir = path.join(artifactRoot(), theme, viewportLabel);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${slug}.png`);
    await page.screenshot({ path: filePath, fullPage: false });

    manifest.push({
      file: filePath,
      phase,
      theme,
      width: viewportLabel,
      slug,
      locale,
    });
    return filePath;
  }

  test('login (public)', async ({ page }) => {
    const health = await page.request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'compose API not running');
    test.skip(process.env['CONTRAST_SCREENSHOT_REVIEW_ONLY'] === '1', 'review-only CI captures');

    for (const viewport of viewportsForRun()) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const theme of THEMES) {
        await page.goto(`${webOrigin}/login`);
        await page.waitForLoadState('networkidle');
        await applyContrastTheme(page, theme);
        const dir = path.join(artifactRoot(), theme, viewport.label);
        await fs.mkdir(dir, { recursive: true });
        const filePath = path.join(dir, 'login.png');
        await page.screenshot({ path: filePath, fullPage: false });
        manifest.push({
          file: filePath,
          phase,
          theme,
          width: viewport.label,
          slug: 'login',
          locale: 'en',
        });
        expect(filePath).toBeTruthy();
      }
    }
  });

  test.describe('authenticated routes', () => {
    test.use({ storageState: smokeFixtureStoragePath() });

    test('core routes and contrast states', async ({ page, request }) => {
      test.setTimeout(300_000);
      const health = await request.get(`${apiBase}/health`);
      test.skip(!health.ok(), 'compose API not running');

      const documentDetailPath = await resolveSmokeReadyDocumentPath(request, apiBase, webOrigin);
      const reviewOnly = process.env['CONTRAST_SCREENSHOT_REVIEW_ONLY'] === '1';
      const captures = capturesForRun();

      for (const viewport of viewportsForRun()) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const capture of captures) {
          for (const theme of THEMES) {
            const filePath = await captureShot(
              page,
              capture.slug,
              capture.locale,
              theme,
              viewport.label,
              documentDetailPath
            );
            expect(filePath).toBeTruthy();
          }
        }

        if (reviewOnly) {
          continue;
        }

        for (const theme of THEMES) {
          await page.goto(`${webOrigin}/structure/labels`, { waitUntil: 'domcontentloaded' });
          await waitForContrastPageReady(page, 'labels', documentDetailPath);
          await applyContrastTheme(page, theme);
          const errorLine = page.locator('p.error').first();
          if ((await errorLine.count()) > 0) {
            await errorLine.scrollIntoViewIfNeeded();
          }
          const errorPath = path.join(artifactRoot(), theme, viewport.label, 'labels-error.png');
          await page.screenshot({ path: errorPath, fullPage: false });
          manifest.push({
            file: errorPath,
            phase,
            theme,
            width: viewport.label,
            slug: 'labels-error',
            locale: 'en',
          });

          await page.goto(`${webOrigin}/docs/styles`);
          await page.waitForLoadState('domcontentloaded');
          const dangerItem = page.locator('.styles-menu-demo .menu-item-danger').first();
          await dangerItem.waitFor({ state: 'visible', timeout: 60_000 });
          await dangerItem.scrollIntoViewIfNeeded();
          await applyContrastTheme(page, theme);
          const dangerPath = path.join(artifactRoot(), theme, viewport.label, 'danger-menu.png');
          await page.screenshot({ path: dangerPath, fullPage: false });
          manifest.push({
            file: dangerPath,
            phase,
            theme,
            width: viewport.label,
            slug: 'danger-menu',
            locale: 'en',
          });
        }
      }
    });
  });
});
