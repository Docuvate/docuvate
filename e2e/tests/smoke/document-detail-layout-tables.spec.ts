import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import { deliveryNoteTablePdfPath } from '../../helpers/layout-table-pdf';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('document detail layout tables', () => {
  test('tables tab renders grid and highlights table overlay in the viewer', async ({ page, request }) => {
    test.setTimeout(300_000);
    const pdfPath = deliveryNoteTablePdfPath();
    const upload = await request.post(`${apiBase}/v1/documents`, {
      headers: { origin: webOrigin },
      multipart: {
        file: {
          name: 'delivery-note-table.pdf',
          mimeType: 'application/pdf',
          buffer: fs.readFileSync(pdfPath),
        },
      },
    });
    expect(upload.ok()).toBeTruthy();
    const docId = String(((await upload.json()) as { id: string }).id);

    const deadline = Date.now() + 300_000;
    while (Date.now() < deadline) {
      const docRes = await request.get(`${apiBase}/v1/documents/${docId}`, {
        headers: { origin: webOrigin },
      });
      const doc = (await docRes.json()) as { status: string; extraction?: { layoutIrAvailable?: boolean } };
      if (doc.status === 'failed') {
        throw new Error('document extraction failed');
      }
      if (doc.status === 'ready' && doc.extraction?.layoutIrAvailable) {
        break;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    await page.goto(`/documents/${docId}`, { waitUntil: 'domcontentloaded' });
    await page.locator('.layout-workspace').waitFor({ state: 'visible', timeout: 300_000 });
    await page.locator('.pdf-page-canvas').first().waitFor({ state: 'visible', timeout: 180_000 });

    await page.getByRole('tab', { name: /Tables|Tabellen/i }).click();
    const dataTable = page.locator('.layout-data-table');
    await expect(dataTable).toBeVisible({ timeout: 30_000 });
    await expect(dataTable.locator('td').first()).not.toBeEmpty();

    await page.locator('.layout-table-card-head').first().click();
    await expect(page.locator('.layout-table-card-active')).toHaveCount(1);
    await expect(page.locator('.pdf-layout-overlay-table.pdf-layout-overlay-active')).toBeVisible({
      timeout: 15_000,
    });
  });
});
