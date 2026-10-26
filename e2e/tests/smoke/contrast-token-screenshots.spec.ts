import fs from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { setTheme } from '../../helpers/ce-ui-audit';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

const VIEWPORTS = [
  { label: '1440', width: 1440, height: 900 },
  { label: '390', width: 390, height: 844 },
] as const;

const THEMES = ['light', 'dark'] as const;

const AUTHENTICATED_CAPTURES: { path: string; slug: string }[] = [
  { path: '/', slug: 'dashboard' },
  { path: '/documents', slug: 'documents' },
  { path: '/settings', slug: 'settings' },
  { path: '/structure/labels', slug: 'labels' },
];

type ManifestEntry = {
  file: string;
  phase: string;
  theme: string;
  width: string;
  slug: string;
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

  async function capturePage(
    page: import('@playwright/test').Page,
    slug: string,
    theme: 'light' | 'dark',
    viewportLabel: string
  ): Promise<string> {
    await setTheme(page, theme);
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
    });
    return filePath;
  }

  async function captureRoute(
    page: import('@playwright/test').Page,
    routePath: string,
    slug: string,
    theme: 'light' | 'dark',
    viewportLabel: string
  ): Promise<string> {
    await page.goto(`${webOrigin}${routePath}`);
    await page.waitForLoadState('networkidle');
    return capturePage(page, slug, theme, viewportLabel);
  }

  test('login (public)', async ({ page }) => {
    const health = await page.request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'compose API not running');

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const theme of THEMES) {
        await page.goto(`${webOrigin}/login`);
        await page.waitForLoadState('networkidle');
        const filePath = await capturePage(page, 'login', theme, viewport.label);
        expect(filePath).toBeTruthy();
      }
    }
  });

  test.describe('authenticated routes', () => {
    test.use({ storageState: smokeFixtureStoragePath() });

    let documentDetailPath = '/documents';

    test.beforeAll(async ({ request }) => {
      const health = await request.get(`${apiBase}/health`);
      if (!health.ok()) {
        return;
      }
      const list = await request.get(`${apiBase}/api/v1/documents?limit=1`);
      if (list.ok()) {
        const body: { items?: { id?: string }[] } = await list.json();
        const id = body.items?.[0]?.id;
        if (id) {
          documentDetailPath = `/documents/${id}`;
        }
      }
    });

    test('core routes and contrast states', async ({ page, request }) => {
      const health = await request.get(`${apiBase}/health`);
      test.skip(!health.ok(), 'compose API not running');

      const routes = [...AUTHENTICATED_CAPTURES, { path: documentDetailPath, slug: 'document-detail' }];

      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const theme of THEMES) {
          for (const route of routes) {
            const filePath = await captureRoute(page, route.path, route.slug, theme, viewport.label);
            expect(filePath).toBeTruthy();
          }

          await page.goto(`${webOrigin}/structure/labels`);
          await page.waitForLoadState('networkidle');
          await setTheme(page, theme);
          const errorLine = page.locator('p.error').first();
          if ((await errorLine.count()) > 0) {
            await errorLine.scrollIntoViewIfNeeded();
          }
          const errorPath = await capturePage(page, 'labels-error', theme, viewport.label);
          expect(errorPath).toBeTruthy();

          await page.goto(`${webOrigin}/docs/styles`);
          await page.waitForLoadState('domcontentloaded');
          const dangerItem = page.locator('.styles-menu-demo .menu-item-danger').first();
          await dangerItem.waitFor({ state: 'visible', timeout: 60_000 });
          await dangerItem.scrollIntoViewIfNeeded();
          const dangerPath = await capturePage(page, 'danger-menu', theme, viewport.label);
          expect(dangerPath).toBeTruthy();
        }
      }
    });
  });
});
