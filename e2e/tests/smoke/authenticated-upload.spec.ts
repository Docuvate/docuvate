import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');
const fixturePhrase = 'E2E_SYNTHETIC_FIXTURE_PHRASE_Q1';

const uploadTitle = 'synthetic-upload.pdf';

test.use({ trace: 'on', storageState: smokeFixtureStoragePath() });

async function attachScreenshot(
  page: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo,
  name: string
) {
  const body = await page.screenshot({ fullPage: true });
  await testInfo.attach(name, { body, contentType: 'image/png' });
  const artifactDir = process.env['E2E_ARTIFACT_DIR'];
  if (artifactDir) {
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.writeFileSync(path.join(artifactDir, name), body);
  }
}

async function uploadSyntheticPdfViaUi(page: import('@playwright/test').Page): Promise<void> {
  const compactBar = page.locator('.upload-compact-bar');
  if (await compactBar.isVisible().catch(() => false)) {
    await compactBar.getByRole('button', { name: /^upload$|^hochladen$/i }).click();
  }

  const uploadSection = page.locator('.library-page .upload-section').first();
  await expect(uploadSection).toBeVisible({ timeout: 90_000 });
  const fileInput = uploadSection.locator('input[type="file"]').first();
  await expect(fileInput).toBeAttached({ timeout: 30_000 });
  await fileInput.setInputFiles(fixturePdf, { timeout: 60_000 });

  const queueItem = page.locator('.upload-queue-item').filter({ hasText: uploadTitle });
  await expect(queueItem).toBeVisible({ timeout: 60_000 });
  await expect(queueItem).toHaveClass(/upload-done/, { timeout: 180_000 });
}

test.describe('Authenticated compose smoke', () => {
  test('login, upload synthetic PDF, extraction and preview succeed', async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    testInfo.annotations.push({ type: 'journey', description: 'compose-smoke-auth-happy-path' });

    await page.goto('/documents');
    await expect(page).toHaveURL(/\/documents/, { timeout: 30_000 });
    await attachScreenshot(page, testInfo, '01-after-login.png');

    await uploadSyntheticPdfViaUi(page);

    const docLink = page.getByRole('link', { name: uploadTitle }).first();
    await expect(docLink).toBeVisible({ timeout: 180_000 });
    const docRow = page.getByRole('row').filter({ has: docLink });
    await expect(docRow).not.toContainText(/^failed$|^fehlgeschlagen$/i);
    await expect(docRow.locator('.badge-ready, .badge.badge-ready')).toHaveCount(1, {
      timeout: 180_000,
    });

    await attachScreenshot(page, testInfo, '02-after-upload-list.png');

    await docRow.locator('a.library-open-doc-btn, a[href*="/documents/"]').first().click();
    await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+/i, { timeout: 30_000 });

    await expect(page.getByText(/loading pdf|pdf wird geladen/i)).toHaveCount(0, { timeout: 90_000 });
    await expect(page.locator('.pdf-page-canvas').first()).toBeVisible({ timeout: 180_000 });
    await expect(page.locator('.textLayer').first()).toContainText(fixturePhrase, {
      timeout: 60_000,
    });

    await attachScreenshot(page, testInfo, '03-document-open-preview.png');
  });
});
