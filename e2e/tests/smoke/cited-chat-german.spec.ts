import { expect, test } from '@playwright/test';
import { provisionCitedChatLibraryOnce } from '../../helpers/cited-chat-fixture';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

async function ragOllamaAvailable(request: import('@playwright/test').APIRequestContext) {
  const res = await request.get(`${apiBase}/v1/settings`);
  if (!res.ok()) {
    return false;
  }
  const body = (await res.json()) as {
    documentChat?: { customerEffective?: string; providers?: Array<{ id: string; available?: boolean }> };
  };
  const provider = body.documentChat?.providers?.find((p) => p.id === 'rag-ollama');
  return body.documentChat?.customerEffective === 'rag-ollama' && provider?.available !== false;
}

test.describe('cited chat German fixtures', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180_000);

  test('library, per-document, and abstention flows reach a terminal generation state', async ({
    request,
  }) => {
    test.skip(!(await ragOllamaAvailable(request)), 'rag-ollama provider unavailable in this stack');

    const fixture = await provisionCitedChatLibraryOnce(request, { apiBase, webOrigin });

    const threadRes = await request.post(`${apiBase}/v1/chat/threads`, {
      data: { title: 'E2E cited chat' },
    });
    expect(threadRes.ok()).toBeTruthy();
    const threadId = String(((await threadRes.json()) as { thread: { id: string } }).thread.id);

    const offTopic = await request.post(`${apiBase}/v1/chat/threads/${threadId}/messages`, {
      data: { message: 'Wie wird das Wetter morgen in Berlin?' },
    });
    expect(offTopic.ok()).toBeTruthy();
    const offTopicMessageId = String(
      ((await offTopic.json()) as { assistantMessage: { id: string } }).assistantMessage.id
    );
    await expect
      .poll(
        async () => {
          const msgRes = await request.get(`${apiBase}/v1/chat/threads/${threadId}/messages`);
          const messages = ((await msgRes.json()) as { messages: Array<{ id: string; generationStatus?: string; content?: string }> })
            .messages;
          const msg = messages.find((m) => m.id === offTopicMessageId);
          return msg?.generationStatus ?? 'pending';
        },
        { timeout: 120_000 }
      )
      .not.toBe('pending');

    const docThreadRes = await request.post(
      `${apiBase}/v1/documents/${fixture.taxDocId}/chat/threads`,
      { data: { title: 'Steuer Chat' } }
    );
    expect(docThreadRes.ok()).toBeTruthy();
    const docThreadId = String(
      ((await docThreadRes.json()) as { thread: { id: string } }).thread.id
    );
    const docMsgRes = await request.post(
      `${apiBase}/v1/documents/${fixture.taxDocId}/chat/threads/${docThreadId}/messages`,
      { data: { message: 'Was kostet die Hundesteuer?' } }
    );
    expect(docMsgRes.ok()).toBeTruthy();
    const docAssistantId = String(
      ((await docMsgRes.json()) as { assistantMessage: { id: string } }).assistantMessage.id
    );
    await expect
      .poll(
        async () => {
          const list = await request.get(
            `${apiBase}/v1/documents/${fixture.taxDocId}/chat/threads/${docThreadId}/messages`
          );
          const messages = ((await list.json()) as { messages: Array<{ id: string; generationStatus?: string }> })
            .messages;
          return messages.find((m) => m.id === docAssistantId)?.generationStatus ?? 'pending';
        },
        { timeout: 120_000 }
      )
      .toMatch(/done|failed/);
  });
});
