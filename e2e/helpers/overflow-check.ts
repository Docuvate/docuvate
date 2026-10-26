// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

const CONTAINERS = ['.document-detail-page', '.layout-side-panel', '.label-panel'];

interface OverflowHit {
  container: string;
  child: string;
  childRight: number;
  parentRight: number;
}

export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const hits = await page.evaluate((selectors) => {
    const skipClosest = [
      '[data-floating-placement]',
      '.toast-region',
      '.overlay-portal',
      '.pdf-page-wrap',
    ];
    const results: OverflowHit[] = [];
    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      nodes.forEach((container) => {
        if (!(container instanceof HTMLElement)) {
          return;
        }
        const descendants = container.querySelectorAll('*');
        descendants.forEach((child) => {
          if (!(child instanceof HTMLElement)) {
            return;
          }
          const parent = child.parentElement;
          if (!(parent instanceof HTMLElement)) {
            return;
          }
          const style = window.getComputedStyle(child);
          const parentStyle = window.getComputedStyle(parent);
          if (
            style.position === 'fixed' ||
            style.position === 'absolute' ||
            style.position === 'sticky'
          ) {
            return;
          }
          if (style.visibility === 'hidden' || style.display === 'none') {
            return;
          }
          if (
            parentStyle.overflowX === 'auto' ||
            parentStyle.overflowX === 'scroll' ||
            parentStyle.overflow === 'auto' ||
            parentStyle.overflow === 'scroll'
          ) {
            return;
          }
          if (skipClosest.some((skip) => child.closest(skip) !== null && !child.matches(skip))) {
            return;
          }
          const parentBox = parent.getBoundingClientRect();
          if (parentBox.width <= 0) {
            return;
          }
          const box = child.getBoundingClientRect();
          if (box.width <= 0 || box.height <= 0) {
            return;
          }
          if (box.right > parentBox.right + 1.5) {
            results.push({
              container: selector,
              child: `${child.tagName.toLowerCase()}.${child.className.toString()}`,
              childRight: box.right,
              parentRight: parentBox.right,
            });
          }
        });
      });
    }
    return results;
  }, CONTAINERS);
  expect(hits, JSON.stringify(hits)).toEqual([]);
}

export async function captureLoadedScreenshot(
  locator: Locator,
  testInfo: Pick<TestInfo, 'attach'>,
  name: string
): Promise<Buffer> {
  await locator.waitFor({ state: 'visible', timeout: 60_000 });
  const body = await locator.screenshot({ animations: 'disabled' });
  await testInfo.attach(name, { body, contentType: 'image/png' });
  const artifactDir = process.env['FIELD_REGIONS_ARTIFACT_DIR'];
  if (artifactDir) {
    mkdirSync(artifactDir, { recursive: true });
    writeFileSync(join(artifactDir, name), body);
  }
  return body;
}
