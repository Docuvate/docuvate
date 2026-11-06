// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * The ribbon follows one rule set on every screen (see "Ribbon system" in app.css): one row on
 * desktop, at most two deliberate rows on tablets, one primary action, labelled controls of one
 * height, and chevrons only on menus.
 */
import { expect, type Locator, type Page, test } from '@playwright/test';

import { installStructuringMocks } from './structuringMocks';

const SCREENS = [
  { slug: 'library', path: '/documents' },
  { slug: 'viewer', path: '/documents/synthetic-doc-0001' },
] as const;

async function groupTops(ribbon: Locator): Promise<number[]> {
  return ribbon.locator('.ribbon-group').evaluateAll((groups) =>
    groups.map((group) => {
      const items = group.querySelector('.ribbon-group-items');
      return Math.round((items ?? group).getBoundingClientRect().top);
    })
  );
}

async function openScreen(page: Page, width: number, screenPath: string) {
  await page.setViewportSize({ width, height: 900 });
  const log = await installStructuringMocks(page);
  await page.goto(screenPath);
  const ribbon = page.getByTestId('app-ribbon');
  await expect(ribbon.locator('.ribbon-group').first()).toBeVisible();
  return { ribbon, log };
}

test.describe('ribbon system', () => {
  for (const width of [1280, 1440, 1920]) {
    for (const screen of SCREENS) {
      test(`${screen.slug} · ${String(width)}: one row with visible group captions`, async ({
        page,
      }) => {
        const { ribbon, log } = await openScreen(page, width, screen.path);
        const tops = await groupTops(ribbon);
        expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(2);
        for (const caption of await ribbon.locator('.ribbon-group-label').all()) {
          await expect(caption).toBeVisible();
        }
        expect(log.unmatched).toEqual([]);
      });
    }
  }

  test('library · 1024: navigation row, then actions and view controls', async ({ page }) => {
    const { ribbon } = await openScreen(page, 1024, '/documents');
    const nav = await ribbon.getByRole('group', { name: 'Bestand' }).boundingBox();
    const capture = await ribbon.getByRole('group', { name: 'Erfassen' }).boundingBox();
    const display = await ribbon.getByRole('group', { name: 'Darstellung' }).boundingBox();
    const output = await ribbon.getByRole('group', { name: 'Ausgabe' }).boundingBox();
    if (!nav || !capture || !display || !output) throw new Error('ribbon groups missing');
    expect(capture.y).toBeGreaterThan(nav.y + nav.height - 1);
    expect(Math.abs(capture.y - display.y)).toBeLessThanOrEqual(2);
    expect(Math.abs(capture.y - output.y)).toBeLessThanOrEqual(2);
    // View controls and output sit at the right edge, actions at the left.
    expect(display.x).toBeGreaterThan(capture.x + capture.width);
  });

  for (const screen of SCREENS) {
    test(`${screen.slug}: one primary, labelled controls of one height, chevrons only on menus`, async ({
      page,
    }) => {
      const { ribbon } = await openScreen(page, 1440, screen.path);
      await expect(ribbon.locator('.ribbon-action--primary')).toHaveCount(1);
      const controls = ribbon.locator(
        '.ribbon-link, .ribbon-action, .custom-select-trigger, .aspect-strip-btn'
      );
      const heights = await controls.evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().height))
      );
      expect(new Set(heights).size).toBe(1);
      for (const control of await ribbon.locator('a, button').all()) {
        const name =
          (await control.getAttribute('aria-label')) ?? (await control.innerText()).trim();
        expect(name.length, 'every ribbon control has a name').toBeGreaterThan(0);
      }
      // Menus (and only menus) end in a chevron.
      const menus = ribbon.locator('[aria-haspopup]');
      for (const menu of await menus.all()) {
        await expect(menu.locator('svg.lucide-chevron-down')).toHaveCount(1);
      }
      await expect(
        ribbon.locator(':is(a, button):not([aria-haspopup]) svg.lucide-chevron-down')
      ).toHaveCount(0);
    });
  }
});
