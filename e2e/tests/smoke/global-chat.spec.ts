import { expect, test } from '@playwright/test';

import {
  createGlobalChatThread,
  GLOBAL_CHAT_ABSTENTION_SNIPPET,
  sendGlobalChatMessage,
  waitForGlobalChatMessage,
} from '../../helpers/global-chat-api';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.describe('global chat navigation', () => {
  test.use({ storageState: smokeFixtureStoragePath() });

  test('thread search rename and delete', async ({ page, request }) => {
    const thread = await createGlobalChatThread(request, apiBase, webOrigin, 'E2E Thread Alpha');
    await page.goto(`${webOrigin}/chat`);
    await page.getByPlaceholder(/durchsuchen|Search conversations/i).fill('Alpha');
    await expect(page.getByRole('button', { name: /E2E Thread Alpha/i })).toBeVisible();
    await page.getByRole('button', { name: /Umbenennen|Rename/i }).first().click();
    await page.getByLabel(/Titel der Unterhaltung|Conversation title/i).fill('E2E Thread Beta');
    await page.getByRole('button', { name: /Speichern|Save/i }).click();
    await expect(page.locator('.doc-chat-thread-title', { hasText: 'E2E Thread Beta' })).toBeVisible();
    await page.getByRole('button', { name: /Löschen|Delete/i }).first().click();
    await expect(page.locator('.doc-chat-thread-title', { hasText: 'E2E Thread Beta' })).toHaveCount(0);
    await request.delete(`${apiBase}/v1/chat/threads/${thread.id}`, {
      headers: { origin: webOrigin },
    }).catch(() => undefined);
  });

  test('navigation opens global chat page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Chat/i }).click();
    await expect(page.locator('#global-chat-heading')).toBeVisible();
    await expect(page.getByPlaceholder(/Frage|Ask/i)).toBeVisible();
  });
});

test.describe('global chat retrieval', () => {
  test.use({ storageState: smokeFixtureStoragePath() });
  test.describe.configure({ mode: 'serial' });

  test('library chat finds Miete with citation via retrieval', async ({ request }) => {
    test.setTimeout(120_000);

    const threadId = await createGlobalChatThread(request, apiBase, webOrigin, 'Global Miete');
    const { assistantId, messagesPath, startedAt } = await sendGlobalChatMessage(
      request,
      apiBase,
      webOrigin,
      threadId,
      'Bis wann ist die Miete fällig?'
    );
    const msg = await waitForGlobalChatMessage(request, messagesPath, webOrigin, assistantId);
    const elapsed = Date.now() - startedAt;
    expect(elapsed).toBeLessThan(5_000);
    expect((msg.content ?? '').toLowerCase()).toMatch(/werktag|miete/);
    expect((msg.citations?.length ?? 0) >= 1).toBeTruthy();
    const quote = msg.citations?.[0]?.quote ?? '';
    expect(quote.length).toBeGreaterThan(2);
  });

  test('Kfz contribution question returns 486,20 EUR with citation', async ({ request }) => {
    test.setTimeout(120_000);

    const threadId = await createGlobalChatThread(request, apiBase, webOrigin, 'Kfz Beitrag');
    const { assistantId, messagesPath, startedAt } = await sendGlobalChatMessage(
      request,
      apiBase,
      webOrigin,
      threadId,
      'Wie hoch ist der Jahresbeitrag für die Kfz-Versicherung?'
    );
    const msg = await waitForGlobalChatMessage(request, messagesPath, webOrigin, assistantId);
    const elapsed = Date.now() - startedAt;
    expect(elapsed).toBeLessThan(5_000);
    expect(elapsed).toBeLessThan(2_000);
    const body = msg.content ?? '';
    expect(body).toMatch(/486[,.]20/);
    expect((msg.citations?.length ?? 0) >= 1).toBeTruthy();
    const cited = msg.citations ?? [];
    const kfzHit = cited.some((c) => {
      const label = `${c.documentTitle} ${c.quote}`.toLowerCase();
      return label.includes('kfz') && /486[,.]20/.test(label);
    });
    expect(kfzHit).toBeTruthy();
  });

  test('Lindenweg rent question returns amount with citation to mietvertrag-lindenweg', async ({
    request,
  }) => {
    test.setTimeout(120_000);

    const threadId = await createGlobalChatThread(request, apiBase, webOrigin, 'Lindenweg Miete');
    const { assistantId, messagesPath, startedAt } = await sendGlobalChatMessage(
      request,
      apiBase,
      webOrigin,
      threadId,
      'Wie hoch ist die Miete im Mietvertrag Lindenweg?'
    );
    const msg = await waitForGlobalChatMessage(request, messagesPath, webOrigin, assistantId);
    const elapsed = Date.now() - startedAt;
    expect(elapsed).toBeLessThan(5_000);
    expect(elapsed).toBeLessThan(2_000);
    const body = (msg.content ?? '').toLowerCase();
    expect(body).toMatch(/945|945,00/);
    expect((msg.citations?.length ?? 0) >= 1).toBeTruthy();
    const cited = msg.citations ?? [];
    const lindenwegHit = cited.some((c) => {
      const label = `${c.documentTitle} ${c.quote}`.toLowerCase();
      return label.includes('lindenweg') || label.includes('mietvertrag-lindenweg');
    });
    expect(lindenwegHit).toBeTruthy();
  });

  test('unknown topic abstains without citations', async ({ request }) => {
    test.setTimeout(120_000);

    const threadId = await createGlobalChatThread(request, apiBase, webOrigin, 'Off-topic');
    const { assistantId, messagesPath } = await sendGlobalChatMessage(
      request,
      apiBase,
      webOrigin,
      threadId,
      'Wie wird das Wetter morgen in Berlin?'
    );
    const msg = await waitForGlobalChatMessage(request, messagesPath, webOrigin, assistantId);
    expect((msg.content ?? '').toLowerCase()).toContain(GLOBAL_CHAT_ABSTENTION_SNIPPET);
    expect(msg.citations?.length ?? 0).toBe(0);
  });
});
