// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Design-system regression: palette freeze at runtime, focus ring, reduced motion, axe (WCAG A/AA)
 * and mobile touch targets on the core surfaces, plus desktop/mobile × light/dark screenshots.
 *
 * Runs against synthetic mocks only (designSystemMocks.ts):
 *   pnpm --filter @docuvate/e2e exec playwright test --config=playwright.design-system.config.ts
 * Screenshots land in DESIGN_SYSTEM_ARTIFACT_DIR (default: e2e/test-results/design-system).
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import { collectUndersizedTouchTargetsInPage } from '../helpers/browser-layout-scans';
import { installDesignSystemMocks } from './designSystemMocks';

const artifactDir =
  process.env['DESIGN_SYSTEM_ARTIFACT_DIR'] ??
  path.join(process.cwd(), 'test-results', 'design-system');

const VIEWPORTS = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'mobile', width: 390, height: 844 },
] as const satisfies readonly { id: string; width: number; height: number }[];

const THEMES = ['light', 'dark'] as const satisfies readonly ('light' | 'dark')[];

const SURFACES = [
  {
    slug: 'catalog',
    path: '/docs/styles',
    ready: '[data-testid="styles-catalog"]',
    touch: '.styles-catalog-hero',
  },
  {
    slug: 'dashboard',
    path: '/',
    ready: '.dashboard-page .page-header',
    touch: '.dashboard-page .page-header',
  },
  {
    slug: 'library',
    path: '/documents',
    ready: '.library-page .page-header',
    touch: '.library-page .page-header',
  },
  {
    slug: 'labels',
    path: '/structure/labels',
    ready: '.labels-page .page-header',
    touch: '.labels-page',
  },
  { slug: 'settings', path: '/settings', ready: '.settings-page', touch: '.settings-section-tabs' },
] as const satisfies readonly { slug: string; path: string; ready: string; touch: string }[];

/** Frozen brand values that must survive any design-system change (mirrors color-freeze.json). */
const FROZEN = {
  light: { accent: '#d9480f', bg: '#f5f1e9', text: '#120f09', 'bg-raised': '#fffaf5' },
  dark: { accent: '#d9480f', bg: '#1e1a13', text: '#f5f1ea', 'bg-raised': '#262118' },
} as const satisfies Record<'light' | 'dark', Record<string, string>>;

async function openSurface(
  page: Page,
  theme: 'light' | 'dark',
  surface: (typeof SURFACES)[number]
) {
  await installDesignSystemMocks(page, theme);
  await page.goto(surface.path);
  await page.locator(surface.ready).first().waitFor({ state: 'visible', timeout: 60_000 });
  await expect(page.locator('html')).toHaveAttribute('data-docuvate-theme', theme);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

test.describe('design system', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeAll(() => {
    fs.mkdirSync(artifactDir, { recursive: true });
  });

  for (const theme of THEMES) {
    test(`palette is unchanged at runtime (${theme})`, async ({ page }) => {
      await openSurface(page, theme, SURFACES[0]);
      const values = await page.evaluate((roles) => {
        const style = getComputedStyle(document.documentElement);
        return Object.fromEntries(
          roles.map((role) => [
            role,
            style.getPropertyValue(`--dv-color-${role}`).trim().toLowerCase(),
          ])
        );
      }, Object.keys(FROZEN[theme]));
      expect(values).toEqual(FROZEN[theme]);
    });
  }

  test('focus ring is visible on primitives and motion is reduced', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openSurface(page, 'light', SURFACES[3]);
    const newLabel = page.locator('.labels-page-new-label-btn');
    await newLabel.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const ring = await newLabel.evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.outlineWidth, style: s.outlineStyle, color: s.outlineColor };
    });
    expect(ring.style).toBe('solid');
    expect(parseFloat(ring.width)).toBeGreaterThanOrEqual(2);
    expect(ring.color).toBe('rgb(217, 72, 15)');

    const duration = await newLabel.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(',').every((d) => parseFloat(d) <= 0.001)).toBe(true);
  });

  test('page headers share the page-title type role', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const sizes: Record<string, string> = {};
    for (const surface of SURFACES.slice(1)) {
      await openSurface(page, 'light', surface);
      sizes[surface.slug] = await page
        .locator('[data-ux="page-title"]')
        .first()
        .evaluate((el) => `${getComputedStyle(el).fontSize}/${getComputedStyle(el).fontWeight}`);
    }
    expect(new Set(Object.values(sizes)).size, JSON.stringify(sizes)).toBe(1);
    expect(Object.values(sizes)[0]).toBe('24px/600');
  });

  test('labels text links: 24px inline target on desktop rows, 44px touch target on mobile', async ({
    page,
  }) => {
    const linkSelector = [
      '.labels-coverage-filter-link',
      '.labels-coverage-threshold-toggle',
      '.labels-todo-review-link',
      '.labels-vocabulary-doc-link',
    ].join(', ');
    const measure = () =>
      page.locator(linkSelector).evaluateAll((nodes) =>
        nodes.map((node) => ({
          cls: node.className,
          height: node.getBoundingClientRect().height,
        }))
      );

    await page.setViewportSize({ width: 1440, height: 900 });
    await openSurface(page, 'light', SURFACES[3]);
    const desktop = await measure();
    expect(desktop.length).toBeGreaterThanOrEqual(4);
    for (const link of desktop) {
      expect(link.height, link.cls).toBeGreaterThanOrEqual(23);
      expect(link.height, link.cls).toBeLessThan(44);
    }
    // Desktop grid rows stay sized by their controls, not by the link hit area.
    const rowHeights = await page
      .locator('.labels-vocabulary-grid--row')
      .evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().height));
    const editHeight = await page
      .locator('.labels-vocabulary-grid--row button')
      .first()
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(rowHeights.length).toBeGreaterThan(0);
    for (const height of rowHeights) {
      expect(height).toBeLessThanOrEqual(editHeight + 24);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await openSurface(page, 'light', SURFACES[3]);
    await expect(page.locator('.labels-vocabulary-card-row').first()).toBeVisible();
    const mobile = await measure();
    expect(mobile.length).toBeGreaterThanOrEqual(4);
    for (const link of mobile) {
      expect(link.height, link.cls).toBeGreaterThanOrEqual(43);
    }
  });

  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      for (const surface of SURFACES) {
        test(`${surface.slug} · ${viewport.id} · ${theme}`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await openSurface(page, theme, surface);

          const axe = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .include('#root')
            .analyze();
          const blocking = axe.violations.filter(
            (v) => v.impact === 'serious' || v.impact === 'critical'
          );
          expect(
            blocking.map(
              (v) =>
                `${v.id}: ${v.nodes
                  .map((n) => n.target.join(' '))
                  .slice(0, 3)
                  .join(' | ')}`
            ),
            `${surface.slug} ${viewport.id} ${theme}`
          ).toEqual([]);

          if (viewport.id === 'mobile') {
            // Labels is scanned as a whole page (content links included); other surfaces cover their chrome.
            const violations = await page
              .locator(surface.touch)
              .first()
              .evaluate(collectUndersizedTouchTargetsInPage);
            expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
          }

          await page.screenshot({
            path: path.join(artifactDir, `${surface.slug}-${viewport.id}-${theme}.png`),
            fullPage: surface.slug !== 'catalog',
          });
        });
      }
    }
  }
});
