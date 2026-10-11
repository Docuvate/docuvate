import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');
const fixturePhrase = 'E2E_SYNTHETIC_FIXTURE_PHRASE_Q1';

function uniqueUploadTitle(testId: string): string {
  const slug = testId.replace(/[^a-z0-9]+/gi, '').slice(-10) || 'upload';
  return `e2e-${slug}.pdf`;
}

/** Distinct bytes so duplicate-stack detection does not hide the doc from the library list. */
function uniquePdfBuffer(): Buffer {
  const base = fs.readFileSync(fixturePdf);
  const stamp = Buffer.from(`\n%%E2E_UPLOAD_RUN=${randomUUID()}\n`, 'utf8');
  return Buffer.concat([base, stamp]);
}

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

async function uploadSyntheticPdfViaUi(
  page: import('@playwright/test').Page,
  uploadTitle: string
): Promise<string> {
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

  const uploadResponse = page.waitForResponse(
    (res) =>
      res.request().method() === 'POST' &&
      /\/documents(\?|$)/.test(res.url()) &&
      res.status() < 500,
    { timeout: 180_000 }
  );
  const fileInput = uploadSection.locator('input[type="file"]');
  await expect(fileInput).toBeAttached({ timeout: 30_000 });
  await fileInput.setInputFiles(
    {
      name: uploadTitle,
      mimeType: 'application/pdf',
      buffer: uniquePdfBuffer(),
    },
    { timeout: 180_000 }
  );

  const created = await uploadResponse;
  expect(created.ok()).toBeTruthy();
  const body = (await created.json()) as { id: string };
  expect(body.id).toBeTruthy();

  const queueItem = page.locator('.upload-queue-item').filter({ hasText: uploadTitle });
  await expect(queueItem).toBeVisible({ timeout: 60_000 });
  await expect(queueItem).toHaveClass(/upload-done/, { timeout: 180_000 });
  return body.id;
}

async function waitForDocumentReadyInBrowser(
  page: import('@playwright/test').Page,
  documentId: string
): Promise<void> {
  await expect
    .poll(
      async () =>
        page.evaluate(async (docId) => {
          const res = await fetch(`/api/v1/documents/${docId}`, { credentials: 'include' });
          if (!res.ok) {
            return `document-${String(res.status)}`;
          }
          const doc = (await res.json()) as { status: string };
          return doc.status;
        }, documentId),
      { timeout: 280_000, intervals: [2000, 3000, 5000] }
    )
    .toBe('ready');
}

async function releaseFromDuplicateStackIfNeeded(
  page: import('@playwright/test').Page,
  documentId: string
): Promise<void> {
  await page.evaluate(async (docId) => {
    const stackRes = await fetch(`/api/v1/documents/${docId}/duplicate-stack`, {
      credentials: 'include',
    });
    if (!stackRes.ok) {
      return;
    }
    const payload = (await stackRes.json()) as {
      stack?: {
        stackId: string;
        primaryDocumentId: string;
        members: Array<{ documentId: string; role: string }>;
      } | null;
    };
    const stack = payload.stack;
    if (!stack) {
      return;
    }
    const membership = stack.members.find((member) => member.documentId === docId);
    if (membership?.role !== 'version') {
      return;
    }
    const release = await fetch(
      `/api/v1/documents/${stack.primaryDocumentId}/duplicate-stack/not-duplicate`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ otherDocumentId: docId }),
      }
    );
    if (release.ok) {
      return;
    }
    await fetch(`/api/v1/documents/${stack.primaryDocumentId}/duplicate-stack/set-primary`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stackId: stack.stackId, documentId: docId }),
    });
  }, documentId);
}

test.describe('Authenticated compose smoke', () => {
  test('login, upload synthetic PDF, extraction and preview succeed', async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000);
    testInfo.annotations.push({ type: 'journey', description: 'compose-smoke-auth-happy-path' });

    await page.goto('/documents');
    await expect(page).toHaveURL(/\/documents/, { timeout: 30_000 });
    await attachScreenshot(page, testInfo, '01-after-login.png');

    const uploadTitle = uniqueUploadTitle(testInfo.testId);
    const readyDocId = await uploadSyntheticPdfViaUi(page, uploadTitle);
    await waitForDocumentReadyInBrowser(page, readyDocId);
    await releaseFromDuplicateStackIfNeeded(page, readyDocId);

    const docHref = `/documents/${readyDocId}`;
    await expect
      .poll(
        async () => {
          await page.goto('/documents', { waitUntil: 'domcontentloaded' });
          await releaseFromDuplicateStackIfNeeded(page, readyDocId);
          const byHref = page.locator(`a[href="${docHref}"]`).first();
          const byTitle = page.getByRole('link', { name: uploadTitle }).first();
          return (
            (await byHref.isVisible().catch(() => false)) ||
            (await byTitle.isVisible().catch(() => false))
          );
        },
        { timeout: 120_000, intervals: [2000, 3000, 5000] }
      )
      .toBe(true);

    const titleLink = page.locator(`a[href="${docHref}"]`).first();
    if (!(await titleLink.isVisible().catch(() => false))) {
      await page.getByRole('link', { name: uploadTitle }).first().click();
    }

    const docItem = page.locator('tr, .doc-card').filter({ has: titleLink });
    await expect(docItem.first()).toBeVisible({ timeout: 30_000 });
    await expect(docItem.first().locator('.badge-ready, .badge.badge-ready')).toBeVisible({
      timeout: 30_000,
    });
    await expect(docItem.first()).not.toContainText(/^failed$|^fehlgeschlagen$/i);

    await attachScreenshot(page, testInfo, '02-after-upload-list.png');

    await titleLink.click();
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
