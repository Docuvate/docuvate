// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

function isDocumentListGet(url: string, method: string): boolean {
  if (method !== 'GET') {
    return false;
  }
  try {
    return /\/v1\/documents$/.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

test.describe('library list pagination request dedupe', () => {
  test.use({ storageState: smokeFixtureStoragePath() });

  test('issues one list GET per loaded page while scrolling', async ({ page }) => {
    const listGets: string[] = [];
    page.on('request', (req) => {
      if (isDocumentListGet(req.url(), req.method())) {
        listGets.push(req.url());
      }
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/documents');
    await page.getByTestId('library-doc-virtual-scroll').waitFor({ state: 'visible' });

    const scroll = page.getByTestId('library-doc-virtual-scroll');
    let pagesLoaded = 1;
    const maxPages = 6;

    while (pagesLoaded < maxPages) {
      const before = listGets.length;
      await scroll.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.waitForTimeout(400);
      const after = listGets.length;
      if (after === before) {
        break;
      }
      pagesLoaded += 1;
    }

    expect(listGets.length).toBe(pagesLoaded);
    const uniqueUrls = new Set(listGets);
    expect(uniqueUrls.size).toBe(listGets.length);
  });
});
