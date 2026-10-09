import { expect, test } from '@playwright/test';
import { provisionCitedChatLibraryOnce } from '../../helpers/cited-chat-fixture';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

const ABSTENTION_SNIPPET = 'nichts gefunden';

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

type ChatMessage = {
  id: string;
  generationStatus?: string;
  content?: string;
  citations?: Array<{ ordinal: number; quote: string; documentId: string }>;
};

async function waitForMessage(
  request: import('@playwright/test').APIRequestContext,
  path: string,
  messageId: string
): Promise<ChatMessage> {
  let last: ChatMessage | undefined;
  await expect
    .poll(
      async () => {
        const msgRes = await request.get(path);
        const messages = ((await msgRes.json()) as { messages: ChatMessage[] }).messages;
        last = messages.find((m) => m.id === messageId);
        return last?.generationStatus ?? 'pending';
      },
      { timeout: 120_000 }
    )
    .toMatch(/done|failed/);
  return last!;
}

test.describe('cited chat German fixtures', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180_000);

  test('abstention, in-domain citations, and multi-document answers', async ({ request }) => {
    test.skip(!(await ragOllamaAvailable(request)), 'rag-ollama provider unavailable in this stack');

    const fixture = await provisionCitedChatLibraryOnce(request, { apiBase, webOrigin });

    const threadRes = await request.post(`${apiBase}/v1/chat/threads`, {
      data: { title: 'E2E cited chat' },
    });
    expect(threadRes.ok()).toBeTruthy();
    const threadId = String(((await threadRes.json()) as { thread: { id: string } }).thread.id);
    const messagesPath = `${apiBase}/v1/chat/threads/${threadId}/messages`;

    const offTopic = await request.post(`${apiBase}/v1/chat/threads/${threadId}/messages`, {
      data: { message: 'Wie wird das Wetter morgen in Berlin?' },
    });
    expect(offTopic.ok()).toBeTruthy();
    const offTopicMessageId = String(
      ((await offTopic.json()) as { assistantMessage: { id: string } }).assistantMessage.id
    );
    const offTopicMsg = await waitForMessage(request, messagesPath, offTopicMessageId);
    expect(offTopicMsg.generationStatus).toBe('done');
    expect((offTopicMsg.content ?? '').toLowerCase()).toContain(ABSTENTION_SNIPPET);
    expect(offTopicMsg.citations?.length ?? 0).toBe(0);

    const inDomain = await request.post(`${apiBase}/v1/chat/threads/${threadId}/messages`, {
      data: { message: 'Was kostet die Hundesteuer?' },
    });
    expect(inDomain.ok()).toBeTruthy();
    const inDomainId = String(
      ((await inDomain.json()) as { assistantMessage: { id: string } }).assistantMessage.id
    );
    const inDomainMsg = await waitForMessage(request, messagesPath, inDomainId);
    expect(inDomainMsg.generationStatus).toBe('done');
    expect((inDomainMsg.content ?? '').toLowerCase()).not.toContain(ABSTENTION_SNIPPET);
    expect((inDomainMsg.citations?.length ?? 0) >= 1).toBeTruthy();
    const quote = inDomainMsg.citations?.[0]?.quote ?? '';
    expect(quote.length).toBeGreaterThan(2);

    const multi = await request.post(`${apiBase}/v1/chat/threads/${threadId}/messages`, {
      data: {
        message: 'Nenne Gesamtsumme der Rechnung Nordwind und die Hundesteuer.',
      },
    });
    expect(multi.ok()).toBeTruthy();
    const multiId = String(
      ((await multi.json()) as { assistantMessage: { id: string } }).assistantMessage.id
    );
    const multiMsg = await waitForMessage(request, messagesPath, multiId);
    expect(multiMsg.generationStatus).toBe('done');
    const docIds = new Set((multiMsg.citations ?? []).map((c) => c.documentId));
    expect(docIds.size).toBeGreaterThanOrEqual(2);

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
    const docMsg = await waitForMessage(
      request,
      `${apiBase}/v1/documents/${fixture.taxDocId}/chat/threads/${docThreadId}/messages`,
      docAssistantId
    );
    expect(docMsg.generationStatus).toBe('done');
    expect((docMsg.citations?.length ?? 0) >= 1).toBeTruthy();
  });
});
