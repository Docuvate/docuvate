import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('labels page accept recommendation', () => {
  test('accepting a new label suggestion with documentIds succeeds', async ({ request }) => {
    const documentsRes = await request.get(`${apiBase}/v1/documents?status=ready`, {
      headers: { origin: webOrigin },
    });
    expect(documentsRes.ok()).toBeTruthy();
    const documentsPayload = (await documentsRes.json()) as { items: { id: string }[] };
    const documents = documentsPayload.items;
    expect(documents.length).toBeGreaterThan(0);

    const recommendationId = `new:cluster:e2e-${String(Date.now())}`;
    const proposedName = `E2E Label ${String(Date.now()).slice(-6)}`;
    const acceptRes = await request.post(
      `${apiBase}/v1/labels/recommendations/${encodeURIComponent(recommendationId)}/accept`,
      {
        headers: { origin: webOrigin },
        data: {
          proposedName,
          documentIds: [documents[0].id],
        },
      }
    );
    expect(acceptRes.status()).toBe(201);
    const body = (await acceptRes.json()) as { tagId: string; action: string };
    expect(body.action).toBe('created');
    expect(body.tagId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  test('labels page accept button does not show action failed', async ({ page, request }) => {
    const recsRes = await request.get(`${apiBase}/v1/labels/recommendations`, {
      headers: { origin: webOrigin },
    });
    expect(recsRes.ok()).toBeTruthy();
    const payload = (await recsRes.json()) as { items: { kind: string }[] };
    if (!payload.items.some((item) => item.kind === 'new')) {
      test.skip();
      return;
    }

    await page.goto(`${webOrigin}/structure/labels`);
    const acceptButton = page.getByRole('button', { name: /Übernehmen|Accept/i }).first();
    await expect(acceptButton).toBeVisible({ timeout: 60_000 });
    await acceptButton.click();

    await expect(page.getByRole('alert').filter({ hasText: /fehlgeschlagen|failed/i })).toHaveCount(0);
  });
});
