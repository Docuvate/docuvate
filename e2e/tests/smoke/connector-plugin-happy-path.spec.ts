// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import {
  CONNECTOR_HAPPY_PATH_INSTALLATION_ID,
  installConnectorHappyPathMocks,
} from '../../helpers/connector-happy-path-fixtures';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://127.0.0.1:5173';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('Connector / plugin happy path (fixtures)', () => {
  test('Paperless catalog → setup → test connection → completed import', async ({ page }) => {
    await installConnectorHappyPathMocks(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${webOrigin}/settings/connectors`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /Paperless-ngx/i }).first()).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/SFTP|sftp_fetch/i).first()).toBeVisible();

    await page.goto(
      `${webOrigin}/settings/connectors/paperless/${CONNECTOR_HAPPY_PATH_INSTALLATION_ID}`,
      { waitUntil: 'domcontentloaded' }
    );

    await expect(page.locator('.paperless-connector-setup')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByPlaceholder(/https:\/\/paperless/i)).toBeVisible();

    const testBtn = page.getByRole('button', { name: /Verbindung testen|Test connection/i });
    await expect(testBtn).toBeVisible();
    await testBtn.click();

    const startBtn = page.getByRole('button', { name: /^Import starten$|^Start import$/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Latest-run fixture is completed; status line uses i18n runProgress.
    await expect(page.locator('.settings-status-line').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.settings-status-line').first()).toContainText(/2/);
  });

  test('small viewport: connector setup does not overflow', async ({ page }) => {
    await installConnectorHappyPathMocks(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(
      `${webOrigin}/settings/connectors/paperless/${CONNECTOR_HAPPY_PATH_INSTALLATION_ID}`,
      { waitUntil: 'domcontentloaded' }
    );
    await expect(page.locator('.paperless-connector-setup')).toBeVisible({ timeout: 60_000 });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });
});
