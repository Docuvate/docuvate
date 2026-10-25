import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = path.join(process.cwd(), 'ce-ui-audit-output', 'api-unreachable');

test.describe('API unreachable full-page recovery', () => {
  test('shows offline screen, polls health, and recovers without manual reload', async ({ page }) => {
    fs.mkdirSync(artifactDir, { recursive: true });

    const gates = { healthFails: true, sessionFails: true };

    await page.route('**/api/health', async (route) => {
      if (gates.healthFails) {
        await route.fulfill({ status: 503, body: 'unavailable' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      });
    });

    await page.route('**/api/auth/get-session**', async (route) => {
      if (gates.sessionFails) {
        await route.abort('failed');
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session: null, user: null }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('docuvate.locale', 'de');
    });

    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.getByTestId('session-boot-error-shell')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/nicht erreichbar|nicht verfügbar/i);
    await page.screenshot({ path: path.join(artifactDir, 'unreachable-light-de.png'), fullPage: true });

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({ path: path.join(artifactDir, 'unreachable-dark-de.png'), fullPage: true });

    gates.healthFails = false;
    gates.sessionFails = false;

    const healthRecovery = page.waitForResponse(
      (response) => response.url().includes('/api/health') && response.status() === 200
    );
    await page.getByRole('button', { name: /Jetzt erneut versuchen/i }).click();
    await healthRecovery;

    await expect(page.getByTestId('session-boot-error-shell')).toBeHidden({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
