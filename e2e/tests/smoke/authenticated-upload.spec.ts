import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');
const fixturePhrase = 'E2E_SYNTHETIC_FIXTURE_PHRASE_Q1';

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

test.describe('Authenticated compose smoke', () => {
  test('login, upload synthetic PDF, extraction and preview succeed', async ({ page, request }, testInfo) => {
    test.setTimeout(300_000);
    testInfo.annotations.push({ type: 'journey', description: 'compose-smoke-auth-happy-path' });

    const uploadRes = await request.post(`${apiBase}/v1/documents`, {
      multipart: {
        file: {
          name: 'synthetic-upload.pdf',
          mimeType: 'application/pdf',
          buffer: fs.readFileSync(fixturePdf),
        },
      },
    });
    expect(uploadRes.ok()).toBeTruthy();
    const uploaded = (await uploadRes.json()) as { id: string };

    await page.goto(`/documents/${uploaded.id}`);
    await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+/i, { timeout: 30_000 });
    await attachScreenshot(page, testInfo, '01-document-open.png');

    await expect(page.getByText(/loading pdf|pdf wird geladen/i)).toHaveCount(0, { timeout: 90_000 });
    await expect(page.locator('.pdf-page-canvas').first()).toBeVisible({ timeout: 180_000 });
    await expect(page.locator('.textLayer').first()).toContainText(fixturePhrase, {
      timeout: 60_000,
    });

    await attachScreenshot(page, testInfo, '02-document-preview.png');
  });
});
