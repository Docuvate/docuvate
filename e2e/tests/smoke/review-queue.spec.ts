import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.describe('review queue happy path', () => {
  test.use({ storageState: smokeFixtureStoragePath() });

  test('review page loads and accept-all API succeeds when queue has items', async ({
    page,
    request,
  }) => {
    const summaryRes = await request.get(`${apiBase}/v1/review-queue/summary`, {
      headers: { origin: webOrigin },
    });
    expect(summaryRes.ok()).toBeTruthy();
    const summary = (await summaryRes.json()) as { pendingCount: number };
    const queueRes = await request.get(`${apiBase}/v1/review-queue?limit=5`, {
      headers: { origin: webOrigin },
    });
    expect(queueRes.ok()).toBeTruthy();
    const queue = (await queueRes.json()) as {
      items: { documentId: string }[];
    };

    await page.goto(`${webOrigin}/review`);
    await expect(page.getByRole('heading', { name: /Prüfen|Review/i })).toBeVisible();

    if (summary.pendingCount === 0 || queue.items.length === 0) {
      await expect(page.getByText(/Keine offenen Vorschläge|No open suggestions/i)).toBeVisible();
      test.skip();
      return;
    }

    const acceptAll = page.getByRole('button', { name: /Alle übernehmen|Accept all/i }).first();
    await expect(acceptAll).toBeVisible();
    await acceptAll.click();
    await expect(page.getByRole('alert').filter({ hasText: /fehlgeschlagen|failed/i })).toHaveCount(0);
  });
});
