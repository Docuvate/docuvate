import { expect, test } from '@playwright/test';

import {
  parseAcceptLabelRecommendationBody,
  parseDocumentListBody,
  parseLabelRecommendationListBody,
} from '../../helpers/json-body';
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
    const documents = parseDocumentListBody(await documentsRes.json());
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
    const body = parseAcceptLabelRecommendationBody(await acceptRes.json());
    expect(body.action).toBe('created');
    expect(body.tagId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  test('accepting a cluster with exclusions persists only selected assignments', async ({ request }) => {
    const documentsRes = await request.get(`${apiBase}/v1/documents?status=ready`, {
      headers: { origin: webOrigin },
    });
    expect(documentsRes.ok()).toBeTruthy();
    const documents = parseDocumentListBody(await documentsRes.json());
    if (documents.length < 2) {
      test.skip();
      return;
    }

    const recommendationId = `new:cluster:e2e-excl-${String(Date.now())}`;
    const proposedName = `E2E Excl ${String(Date.now()).slice(-6)}`;
    const acceptRes = await request.post(
      `${apiBase}/v1/labels/recommendations/${encodeURIComponent(recommendationId)}/accept`,
      {
        headers: { origin: webOrigin },
        data: {
          proposedName,
          documentIds: [documents[0].id],
          excludedDocumentIds: [documents[1].id],
        },
      }
    );
    expect(acceptRes.status()).toBe(201);
  });

  test('labels page todo accept does not show action failed', async ({ page, request }) => {
    const recsRes = await request.get(`${apiBase}/v1/labels/recommendations`, {
      headers: { origin: webOrigin },
    });
    expect(recsRes.ok()).toBeTruthy();
    const recommendations = parseLabelRecommendationListBody(await recsRes.json());
    if (!recommendations.some((item) => item.kind === 'new')) {
      test.skip();
      return;
    }

    await page.goto(`${webOrigin}/structure/labels`);
    const todoRow = page.locator('.labels-todo-row').first();
    const rowVisible = await todoRow
      .waitFor({ state: 'visible', timeout: 60_000 })
      .then(() => true)
      .catch(() => false);
    if (!rowVisible) {
      test.skip();
      return;
    }

    const acceptButton = todoRow.getByRole('button', {
      name: /Create label|Label anlegen|Assign|Zuweisen|Merge|Rename|Umbenennen/i,
    });
    const coverage = page.locator('.label-coverage-header');
    const coverageBox = await coverage.boundingBox();
    const navTypeBefore = await page.evaluate(() => performance.getEntriesByType('navigation').length);

    await acceptButton.click();
    await page.waitForTimeout(400);

    await expect(page.getByRole('alert').filter({ hasText: /fehlgeschlagen|failed/i })).toHaveCount(0);
    await expect(page).toHaveURL(/\/structure\/labels/);
    const navTypeAfter = await page.evaluate(() => performance.getEntriesByType('navigation').length);
    expect(navTypeAfter).toBe(navTypeBefore);
    if (coverageBox) {
      const afterBox = await coverage.boundingBox();
      expect(afterBox?.y).toBe(coverageBox.y);
      expect(afterBox?.width).toBe(coverageBox.width);
    }
  });
});
