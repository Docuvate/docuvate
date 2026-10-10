import { expect, test } from '@playwright/test';
import { provisionCitedChatLibraryOnce } from '../../helpers/cited-chat-fixture';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.describe('global chat navigation', () => {
  test.use({ storageState: smokeFixtureStoragePath() });

  test('navigation opens global chat page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Chat/i }).click();
    await expect(page.getByRole('heading', { name: /Chat/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Frage|Ask/i)).toBeVisible();
  });
});

test.describe('global chat retrieval', () => {
  test('library chat finds Miete quickly via retrieval', async ({ request }) => {
    test.setTimeout(120_000);
    await provisionCitedChatLibraryOnce(request, { apiBase, webOrigin });

    const threadRes = await request.post(`${apiBase}/v1/chat/threads`, {
      data: { title: 'Global Miete' },
    });
    expect(threadRes.ok()).toBeTruthy();
    const threadId = String(((await threadRes.json()) as { thread: { id: string } }).thread.id);
    const started = Date.now();
    const msgRes = await request.post(`${apiBase}/v1/chat/threads/${threadId}/messages`, {
      data: { message: 'Bis wann ist die Miete fällig?' },
    });
    expect(msgRes.ok()).toBeTruthy();
    const assistantId = String(
      ((await msgRes.json()) as { assistantMessage: { id: string } }).assistantMessage.id
    );
    const messagesPath = `${apiBase}/v1/chat/threads/${threadId}/messages`;
    let content = '';
    await expect
      .poll(
        async () => {
          const list = await request.get(messagesPath);
          const messages = ((await list.json()) as {
            messages: Array<{ id: string; generationStatus?: string; content?: string }>;
          }).messages;
          const msg = messages.find((m) => m.id === assistantId);
          content = msg?.content ?? '';
          return msg?.generationStatus ?? 'pending';
        },
        { timeout: 90_000 }
      )
      .toBe('done');
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(5_000);
    expect(content.toLowerCase()).toMatch(/werktag|miete/);
  });
});
