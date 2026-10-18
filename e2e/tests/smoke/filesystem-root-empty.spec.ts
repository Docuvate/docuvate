import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('filesystem root empty state', () => {
  test('root empty state is centered and within content pane', async ({ page }) => {
    await page.goto(`${webOrigin}/filesystem`, { waitUntil: 'domcontentloaded' });
    const empty = page.getByTestId('filesystem-root-empty');
    if ((await empty.count()) === 0) {
      test.skip();
      return;
    }

    await expect(empty).toBeVisible({ timeout: 60_000 });
    const layout = await empty.evaluate((el) => {
      const pane = el.closest('.dateisystem-content-body');
      const emptyBox = el.getBoundingClientRect();
      const paneBox = pane?.getBoundingClientRect();
      if (!paneBox) {
        return null;
      }
      return {
        centeredX:
          Math.abs(emptyBox.left + emptyBox.width / 2 - (paneBox.left + paneBox.width / 2)) < 48,
        withinPane:
          emptyBox.left >= paneBox.left - 4 && emptyBox.right <= paneBox.right + 4,
      };
    });
    expect(layout?.centeredX).toBe(true);
    expect(layout?.withinPane).toBe(true);
  });
});
