import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');
const fixturePhrase = 'E2E_SYNTHETIC_FIXTURE_PHRASE_Q1';

const uploadTitle = 'synthetic-upload.pdf';

test.use({ trace: 'on', storageState: smokeFixtureStoragePath() });

async function attachScreenshot(page: import('@playwright/test').Page, testInfo: import('@playwright/test').TestInfo, name: string) {
  const body = await page.screenshot({ fullPage: true });
  await testInfo.attach(name, { body, contentType: 'image/png' });
  const artifactDir = process.env['E2E_ARTIFACT_DIR'];
  if (artifactDir) {
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.writeFileSync(path.join(artifactDir, name), body);
  }
}

test.describe('Authenticated compose smoke', () => {
  test('login, upload synthetic PDF, extraction and preview succeed', async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    testInfo.annotations.push({ type: 'journey', description: 'compose-smoke-auth-happy-path' });

    await page.goto('/');
    await expect(page).toHaveURL((url) => url.pathname === '/', { timeout: 15_000 });
    await page.getByRole('link', { name: /documents|dokumente/i }).first().click();
    await expect(page).toHaveURL(/\/documents/, { timeout: 15_000 });
    await attachScreenshot(page, testInfo, '01-after-login.png');

    await expect(
      page.getByRole('region', { name: /upload documents|dokumente hochladen/i })
    ).toBeVisible({ timeout: 45_000 });
    const fileInput = page.getByLabel(/choose files|dateien auswählen/i);
    if ((await fileInput.count()) === 0) {
      const uploadTrigger = page.getByRole('button', { name: /^upload$|^hochladen$/i });
      await uploadTrigger.click();
    }
    await fileInput.first().setInputFiles(fixturePdf);

    const docRow = page.getByRole('row').filter({ hasText: uploadTitle });
    await expect(docRow).toBeVisible({ timeout: 90_000 });
    await expect(docRow).not.toContainText(/^failed$|^fehlgeschlagen$/i);
    await expect(docRow.locator('.badge-ready, .badge.badge-ready')).toHaveCount(1, { timeout: 180_000 });

    await attachScreenshot(page, testInfo, '02-after-upload-list.png');

    await docRow
      .locator('a.library-open-doc-btn, a[href*="/documents/"]')
      .first()
      .click();
    await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+/i, { timeout: 30_000 });

    await expect(page.getByText(/loading pdf|pdf wird geladen/i)).toHaveCount(0, { timeout: 90_000 });
    await expect(page.locator('.pdf-page-canvas').first()).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('.textLayer').first()).toContainText(fixturePhrase, {
      timeout: 30_000,
    });

    await attachScreenshot(page, testInfo, '03-document-open-preview.png');
  });
});
