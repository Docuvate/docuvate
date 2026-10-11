import { expect, type APIRequestContext } from '@playwright/test';

export type GlobalChatMessage = {
  id: string;
  generationStatus?: string;
  content?: string;
  citations?: Array<{ documentId: string; documentTitle: string; quote: string }>;
};

export const GLOBAL_CHAT_ABSTENTION_SNIPPET = 'nichts gefunden';

export async function createGlobalChatThread(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string,
  title: string
): Promise<string> {
  const threadRes = await request.post(`${apiBase}/v1/chat/threads`, {
    headers: { origin: webOrigin },
    data: { title },
  });
  expect(threadRes.ok()).toBeTruthy();
  return String(((await threadRes.json()) as { thread: { id: string } }).thread.id);
}

export async function sendGlobalChatMessage(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string,
  threadId: string,
  message: string
): Promise<{ assistantId: string; messagesPath: string; startedAt: number }> {
  const startedAt = Date.now();
  const msgRes = await request.post(`${apiBase}/v1/chat/threads/${threadId}/messages`, {
    headers: { origin: webOrigin },
    data: { message },
  });
  expect(msgRes.ok()).toBeTruthy();
  const assistantId = String(
    ((await msgRes.json()) as { assistantMessage: { id: string } }).assistantMessage.id
  );
  return {
    assistantId,
    messagesPath: `${apiBase}/v1/chat/threads/${threadId}/messages`,
    startedAt,
  };
}

export async function waitForGlobalChatMessage(
  request: APIRequestContext,
  messagesPath: string,
  webOrigin: string,
  assistantId: string
): Promise<GlobalChatMessage> {
  let last: GlobalChatMessage | undefined;
  await expect
    .poll(
      async () => {
        const list = await request.get(messagesPath, { headers: { origin: webOrigin } });
        const messages = ((await list.json()) as { messages: GlobalChatMessage[] }).messages;
        last = messages.find((m) => m.id === assistantId);
        return last?.generationStatus ?? 'pending';
      },
      { timeout: 120_000 }
    )
    .toBe('done');
  return last!;
}
