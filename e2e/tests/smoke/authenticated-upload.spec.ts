import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');
const fixturePhrase = 'E2E_SYNTHETIC_FIXTURE_PHRASE_Q1';

const uploadTitle = 'synthetic-upload.pdf';
const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

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
  const chooseFiles = uploadSection
    .getByRole('button', { name: /choose files|dateien auswählen/i })
    .first();
  await expect(chooseFiles).toBeVisible({ timeout: 30_000 });
  const fileInput = uploadSection.locator('input[type="file"]').first();
  try {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 20_000 }),
      chooseFiles.click(),
    ]);
    await fileChooser.setFiles(fixturePdf);
  } catch {
    await fileInput.setInputFiles(fixturePdf, { timeout: 60_000 });
  }

  const queueItem = page.locator('.upload-queue-item').filter({ hasText: uploadTitle });
  await expect(queueItem).toBeVisible({ timeout: 60_000 });
  await expect(queueItem).toHaveClass(/upload-done/, { timeout: 180_000 });
}

test.describe('Authenticated compose smoke', () => {
  test('login, upload synthetic PDF, extraction and preview succeed', async ({
    page,
    request,
  }, testInfo) => {
    test.setTimeout(300_000);
    testInfo.annotations.push({ type: 'journey', description: 'compose-smoke-auth-happy-path' });

    await page.goto('/documents');
    await expect(page).toHaveURL(/\/documents/, { timeout: 30_000 });
    await attachScreenshot(page, testInfo, '01-after-login.png');

    await uploadSyntheticPdfViaUi(page);

    let readyDocId = '';
    await expect
      .poll(
        async () => {
          const res = await request.get(`${apiBase}/v1/documents`, {
            headers: { origin: webOrigin },
          });
          if (!res.ok()) {
            return '';
          }
          const docs = (await res.json()) as Array<{ id: string; filename: string; status: string }>;
          const match = docs.find((d) => d.filename === uploadTitle && d.status === 'ready');
          readyDocId = match?.id ?? '';
          return readyDocId;
        },
        { timeout: 240_000, intervals: [2000, 3000, 5000] }
      )
      .not.toBe('');

    await page.reload({ waitUntil: 'domcontentloaded' });

    const docRow = page
      .getByRole('row')
      .filter({ hasText: uploadTitle })
      .filter({ has: page.locator('.badge-ready, .badge.badge-ready') });
    await expect(docRow.first()).toBeVisible({ timeout: 60_000 });
    await expect(docRow.first()).not.toContainText(/^failed$|^fehlgeschlagen$/i);

    await attachScreenshot(page, testInfo, '02-after-upload-list.png');

    await docRow.first().locator('a.library-open-doc-btn, a[href*="/documents/"]').first().click();
    await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+/i, { timeout: 30_000 });

    await expect(page.getByText(/loading pdf|pdf wird geladen/i)).toHaveCount(0, { timeout: 180_000 });
    const layoutWorkspace = page.locator('.layout-workspace');
    const pdfCanvas = page.locator('.pdf-page-canvas').first();
    if (await layoutWorkspace.isVisible().catch(() => false)) {
      await expect(layoutWorkspace).toBeVisible({ timeout: 180_000 });
    } else {
      await expect(pdfCanvas).toBeVisible({ timeout: 180_000 });
      await expect(page.locator('.textLayer').first()).toContainText(fixturePhrase, {
        timeout: 120_000,
      });
    }

    await attachScreenshot(page, testInfo, '03-document-open-preview.png');
  });
});
