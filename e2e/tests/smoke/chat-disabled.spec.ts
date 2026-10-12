import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('chat disabled in settings', () => {
  let restoreProvider: string | null | undefined;

  test.afterEach(async ({ request }) => {
    if (restoreProvider === undefined) {
      return;
    }
    await request.patch(`${apiBase}/v1/settings`, {
      headers: { origin: webOrigin },
      data: { preferredChatProvider: restoreProvider },
    });
    restoreProvider = undefined;
  });

  test('global and document chat show disabled state and API returns 403', async ({
    page,
    request,
  }) => {
    const settingsRes = await request.get(`${apiBase}/v1/settings`, {
      headers: { origin: webOrigin },
    });
    expect(settingsRes.ok()).toBeTruthy();
    const settings = (await settingsRes.json()) as { preferredChatProvider?: string | null };
    restoreProvider = settings.preferredChatProvider ?? null;

    const patchRes = await request.patch(`${apiBase}/v1/settings`, {
      headers: { origin: webOrigin },
      data: { preferredChatProvider: 'off' },
    });
    expect(patchRes.ok()).toBeTruthy();
    const patched = (await patchRes.json()) as { documentChatUiEnabled?: boolean };
    expect(patched.documentChatUiEnabled).toBe(false);

    await page.goto(`${webOrigin}/chat`);
    await expect(page.locator('.doc-chat-disabled-overlay')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.doc-chat-composer input')).toBeDisabled();

    const threadRes = await request.post(`${apiBase}/v1/chat/threads`, {
      headers: { origin: webOrigin },
      data: {},
    });
    expect(threadRes.status()).toBe(403);

    const documentsRes = await request.get(`${apiBase}/v1/documents?status=ready&limit=1`, {
      headers: { origin: webOrigin },
    });
    expect(documentsRes.ok()).toBeTruthy();
    const documents = (await documentsRes.json()) as { items: { id: string }[] };
    const docId = documents.items[0]?.id;
    if (docId) {
      await page.goto(`${webOrigin}/documents/${docId}`);
      const chatTab = page.getByRole('tab', { name: /^Chat$/i });
      if ((await chatTab.count()) > 0) {
        await chatTab.click();
        await expect(page.locator('.doc-chat-disabled-overlay')).toBeVisible({ timeout: 30_000 });
      }
    }
  });
});
