import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, request as playwrightRequest, test } from '@playwright/test';

import { domRectToRect, rectsOverlap } from '../../helpers/geometry';
import { uploadLayoutTableDocument } from '../../helpers/layout-chat-fixture';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';
import { ensureWorkstreamEFilesystemTree } from '../../helpers/workstream-e-filesystem-fixture';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const artifactRoot =
  process.env['WORKSTREAM_E_ARTIFACT_DIR'] ?? path.join(process.cwd(), 'workstream-e-artifacts');

const VIEWPORTS = [
  { label: '1440', width: 1440, height: 900 },
  { label: '1024', width: 1024, height: 900 },
  { label: '390', width: 390, height: 844 },
] as const;

const TOUCH_MIN_PX = 44;
const TOUCH_TOLERANCE_PX = 1;

test.use({ storageState: smokeFixtureStoragePath() });

async function requireApi(page: import('@playwright/test').Page): Promise<void> {
  const health = await page.request.get(`${apiBase}/health`);
  test.skip(!health.ok(), 'compose API not running');
}

async function screenshotLoaded(
  page: import('@playwright/test').Page,
  slug: string,
  viewportLabel: string
): Promise<string> {
  const digest = createHash('md5').update(`${slug}-${viewportLabel}-${Date.now()}`).digest('hex').slice(0, 12);
  const dir = path.join(artifactRoot, viewportLabel);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${slug}-${digest}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

async function openWorkstreamEFilesystemTree(
  page: import('@playwright/test').Page,
  browseFolderId: string
): Promise<void> {
  await page.goto(`${webOrigin}/filesystem/folders/${browseFolderId}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.locator('.dateisystem-sidebar').waitFor({ state: 'visible', timeout: 90_000 });
  const row = page
    .locator('.dateisystem-tree-row')
    .filter({ has: page.locator('.dateisystem-tree-menu-btn, .dateisystem-tree-add-btn') })
    .first();
  await row.waitFor({ state: 'visible', timeout: 90_000 });
  await row.scrollIntoViewIfNeeded();
  await row.hover();
}

test.describe('Workstream E — layout, mobile, a11y', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let layoutPdfDocumentId: string | null = null;
  let workstreamBrowseFolderId: string | null = null;

  test.beforeAll(async () => {
    const healthRes = await playwrightRequest.newContext().then(async (probe) => {
      try {
        return await probe.get(`${apiBase}/health`);
      } finally {
        await probe.dispose();
      }
    });
    if (!healthRes.ok()) {
      return;
    }

    const authed = await playwrightRequest.newContext({
      storageState: smokeFixtureStoragePath(),
    });
    try {
      const filesystem = await ensureWorkstreamEFilesystemTree(authed, apiBase, webOrigin);
      workstreamBrowseFolderId = filesystem.browseFolderId;
      layoutPdfDocumentId = await uploadLayoutTableDocument(authed, apiBase, webOrigin);
    } finally {
      await authed.dispose();
    }
  });

  for (const viewport of VIEWPORTS) {
    test(`F13 folder tree link vs actions (${viewport.label}px)`, async ({ page }) => {
      await requireApi(page);
      expect(workstreamBrowseFolderId, 'workstream E filesystem fixture').toBeTruthy();
      if (!workstreamBrowseFolderId) {
        return;
      }
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openWorkstreamEFilesystemTree(page, workstreamBrowseFolderId);
      const row = page
        .locator('.dateisystem-tree-row')
        .filter({ has: page.locator('.dateisystem-tree-menu-btn, .dateisystem-tree-add-btn') })
        .first();
      const overlap = await row.evaluate((treeRow) => {
        const link = treeRow.querySelector('a.dateisystem-tree-link');
        const action = treeRow.querySelector(
          '.dateisystem-tree-actions .dateisystem-tree-menu-btn, .dateisystem-tree-actions .dateisystem-tree-add-btn'
        );
        if (!link || !action) {
          return { ok: false as const, reason: 'missing link or action control' };
        }
        const lr = link.getBoundingClientRect();
        const ar = action.getBoundingClientRect();
        const intersects =
          lr.left < ar.right &&
          lr.right > ar.left &&
          lr.top < ar.bottom &&
          lr.bottom > ar.top;
        return { ok: !intersects, linkRight: lr.right, actionLeft: ar.left };
      });
      expect(overlap.ok, JSON.stringify(overlap)).toBe(true);
      await screenshotLoaded(page, 'f13-filesystem-tree', viewport.label);
    });
  }

  test('F17 password field toggle padding', async ({ page }) => {
    await requireApi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webOrigin}/login`);
    await page.locator('input.password-input').fill('long-password-value-for-padding-check');
    const metrics = await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>('.password-input');
      const toggle = document.querySelector<HTMLButtonElement>('.password-input-toggle');
      if (!input || !toggle) {
        return { ok: false as const, reason: 'missing controls' };
      }
      const paddingRight = Number.parseFloat(getComputedStyle(input).paddingRight);
      const toggleWidth = toggle.getBoundingClientRect().width;
      return { ok: paddingRight >= toggleWidth - 1, paddingRight, toggleWidth };
    });
    expect(metrics.ok, JSON.stringify(metrics)).toBe(true);
    await screenshotLoaded(page, 'f17-password-input', '1440');
  });

  test('F18 documents toolbar search vs filter at 1024px', async ({ page }) => {
    await requireApi(page);
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(`${webOrigin}/documents`);
    const searchRow = page.locator('.library-list-search.library-search-row').first();
    await searchRow.waitFor({ state: 'visible', timeout: 60_000 });
    const boxes = await searchRow.evaluate((row) => {
      const input = row.querySelector('input');
      const filter = row.querySelector('.library-filter-toggle');
      if (!input || !filter) {
        return { ok: false as const, reason: 'missing controls' };
      }
      return {
        ok: true as const,
        input: input.getBoundingClientRect(),
        filter: filter.getBoundingClientRect(),
      };
    });
    expect(boxes.ok, JSON.stringify(boxes)).toBe(true);
    if (!boxes.ok) {
      return;
    }
    const inputRect = domRectToRect(boxes.input);
    const filterRect = domRectToRect(boxes.filter);
    expect(rectsOverlap(inputRect, filterRect, 2)).toBe(false);
    await screenshotLoaded(page, 'f18-documents-toolbar', '1024');
  });

  test('F19 PDF viewer toolbar mobile layout at 390px', async ({ page }) => {
    await requireApi(page);
    test.skip(!layoutPdfDocumentId, 'layout PDF fixture unavailable');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${webOrigin}/documents/${layoutPdfDocumentId}`);
    await page.locator('.pdf-viewer-toolbar').waitFor({ state: 'visible', timeout: 120_000 });
    await page.locator('.pdf-viewer-pager').waitFor({ state: 'visible', timeout: 120_000 });
    const layout = await page.evaluate(() => {
      const accessory = document.querySelector('.pdf-viewer-toolbar-accessory');
      const pager = document.querySelector('.pdf-viewer-pager');
      if (!pager) {
        return { ok: false as const, reason: 'missing pager' };
      }
      const pr = pager.getBoundingClientRect();
      if (!accessory) {
        return { ok: true as const, pagerOnly: true, pagerTop: pr.top };
      }
      const ar = accessory.getBoundingClientRect();
      const intersects =
        ar.left < pr.right &&
        ar.right > pr.left &&
        ar.top < pr.bottom &&
        ar.bottom > pr.top;
      const stacked = ar.bottom <= pr.top + 2 || pr.bottom <= ar.top + 2;
      return { ok: !intersects && stacked, accessoryBottom: ar.bottom, pagerTop: pr.top };
    });
    expect(layout.ok, JSON.stringify(layout)).toBe(true);
    await screenshotLoaded(page, 'f19-pdf-toolbar', '390');
  });

  test('F22 touch targets ≥44px at 390px', async ({ page }) => {
    await requireApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${webOrigin}/documents`);
    await page.locator('.app-topbar').waitFor({ state: 'visible', timeout: 60_000 });
    await page.locator('.topbar-menu-trigger').waitFor({ state: 'visible', timeout: 30_000 });
    await page.locator('.library-documents-panel, .library-table-loading').first().waitFor({
      state: 'visible',
      timeout: 60_000,
    });
    const undersized = await page.evaluate(
      ({ minPx, tolerance }) => {
        const selectors = [
          '.topbar-menu-trigger',
          '.icon-btn-sm',
          '.icon-btn-md',
          '.library-table-header .checkbox-field',
          '.library-doc-row .checkbox-field',
          '.bulk-bar-select-all-matching',
          '.password-input-toggle',
        ];
        const hits: string[] = [];
        for (const selector of selectors) {
          for (const el of document.querySelectorAll(selector)) {
            const rect = el.getBoundingClientRect();
            if (rect.width < minPx - tolerance || rect.height < minPx - tolerance) {
              hits.push(`${selector} ${rect.width}x${rect.height}`);
            }
          }
        }
        return hits;
      },
      { minPx: TOUCH_MIN_PX, tolerance: TOUCH_TOLERANCE_PX }
    );
    expect(undersized, undersized.join('; ')).toEqual([]);
    await screenshotLoaded(page, 'f22-touch-targets', '390');
  });

  test('F24 skip link focus target and axe', async ({ page }) => {
    await requireApi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(webOrigin);
    await page.locator('.skip-link').waitFor({ state: 'attached' });
    await page.keyboard.press('Tab');
    const focusedSkip = await page.evaluate(() => document.activeElement?.classList.contains('skip-link'));
    expect(focusedSkip).toBe(true);
    const axe = await new AxeBuilder({ page }).include('.skip-link').include('#app-main-content').analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);
    await screenshotLoaded(page, 'f24-skip-link', '1440');
  });

  test('F25 connector catalog actions vs description', async ({ page }) => {
    await requireApi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webOrigin}/settings/connectors`);
    await page.locator('.connector-catalog-card').first().waitFor({ state: 'visible', timeout: 60_000 });
    const overlap = await page.evaluate(() => {
      const card = document.querySelector('.connector-catalog-card');
      if (!card) {
        return { ok: false as const, reason: 'missing card' };
      }
      const description = card.querySelector('.connector-catalog-description');
      const action = card.querySelector('.connector-catalog-actions .btn, .connector-catalog-actions .button');
      if (!description || !action) {
        return { ok: true as const, skipped: true };
      }
      const dr = description.getBoundingClientRect();
      const ar = action.getBoundingClientRect();
      const intersects =
        dr.left < ar.right &&
        dr.right > ar.left &&
        dr.top < ar.bottom &&
        dr.bottom > ar.top;
      return { ok: !intersects };
    });
    expect(overlap.ok, JSON.stringify(overlap)).toBe(true);
    await screenshotLoaded(page, 'f25-connectors', '1440');
  });

  test('F26 2FA footer links do not overlap', async ({ page }) => {
    await requireApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${webOrigin}/login/two-factor`);
    const twoFactorCard = page.locator('.auth-card--two-factor');
    if (!(await twoFactorCard.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, '2FA screen requires an in-progress sign-in session');
    }
    const footer = page.locator('.auth-screen-footer');
    await footer.waitFor({ state: 'visible', timeout: 30_000 });
    const links = footer.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const boxes = await links.evaluateAll((elements) =>
      elements.map((el) => el.getBoundingClientRect())
    );
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(rectsOverlap(domRectToRect(boxes[i]!), domRectToRect(boxes[j]!), 2)).toBe(false);
      }
    }
    await screenshotLoaded(page, 'f26-two-factor-footer', '390');
  });

  test('F27 dashboard truncated titles expose tooltip', async ({ page }) => {
    await requireApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(webOrigin);
    await page.locator('.dashboard-widget-title').first().waitFor({ state: 'visible', timeout: 60_000 });
    const titles = await page.locator('.dashboard-widget-title').evaluateAll((elements) =>
      elements.map((el) => ({
        text: el.textContent ?? '',
        titleAttr: el.getAttribute('title'),
        truncated: el.scrollWidth > el.clientWidth + 1,
      }))
    );
    for (const row of titles) {
      if (row.truncated) {
        expect(row.titleAttr, row.text).toBeTruthy();
      }
    }
    await screenshotLoaded(page, 'f27-dashboard-titles', '390');
  });

  test('F28 styles docs table and server URL label', async ({ page }) => {
    await requireApi(page);
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(`${webOrigin}/docs/styles`);
    await page.locator('#ds-server-url').waitFor({ state: 'visible', timeout: 60_000 });
    const labelFor = await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>('#ds-server-url');
      const label = document.querySelector<HTMLLabelElement>('label[for="ds-server-url"]');
      return { hasLabel: Boolean(label), labelledBy: input?.labels?.length ?? 0 };
    });
    expect(labelFor.hasLabel).toBe(true);
    expect(labelFor.labelledBy).toBeGreaterThan(0);
    const tableClip = await page.evaluate(() => {
      const table = document.querySelector('.styles-showcase-doc-table');
      const title = document.querySelector('.styles-showcase-subsection-title');
      if (!table || !title) {
        return { ok: false as const, reason: 'missing nodes' };
      }
      const tr = title.getBoundingClientRect();
      const parent = table.parentElement;
      const pr = parent?.getBoundingClientRect();
      if (!pr) {
        return { ok: false as const, reason: 'missing parent' };
      }
      const titleClipped = tr.right > pr.right + 1 || tr.left < pr.left - 1;
      return { ok: !titleClipped, titleRight: tr.right, parentRight: pr.right };
    });
    expect(tableClip.ok, JSON.stringify(tableClip)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('#ds-server-url').analyze();
    const labelViolations = axe.violations.filter((v) => v.id === 'label');
    expect(labelViolations).toEqual([]);
    await screenshotLoaded(page, 'f28-styles-docs', '1024');
  });
});
