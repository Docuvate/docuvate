import { ollamaChatBaseUrl, ollamaChatModel } from './ollama-chat-request.js';
import { buildOllamaChatBody, ollamaChatIdleTimeoutMs } from './ollama-chat-options.js';

export type OllamaStreamFailure =
  | { kind: 'idle_timeout' }
  | { kind: 'aborted' }
  | { kind: 'http_error'; status: number; detail?: string }
  | { kind: 'network_error'; detail: string };

export interface StreamOllamaChatParams {
  messages: Array<{ role: string; content: string }>;
  onToken: (token: string, fullText: string) => void | Promise<void>;
  shouldAbort: () => boolean | Promise<boolean>;
  idleTimeoutMs?: number;
  extraBody?: Record<string, unknown>;
}

export async function streamOllamaChat(
  params: StreamOllamaChatParams
): Promise<{ content: string } | { failure: OllamaStreamFailure }> {
  const ollamaUrl = ollamaChatBaseUrl();
  const model = ollamaChatModel();
  const idleTimeoutMs = params.idleTimeoutMs ?? ollamaChatIdleTimeoutMs();

  let response: Response;
  try {
    response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...buildOllamaChatBody(model, params.messages, true),
        ...params.extraBody,
      }),
    });
  } catch (err) {
    return {
      failure: {
        kind: 'network_error',
        detail: err instanceof Error ? err.message : String(err),
      },
    };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return { failure: { kind: 'http_error', status: response.status, detail } };
  }

  if (!response.body) {
    return { failure: { kind: 'network_error', detail: 'empty response body' } };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let lastTokenAt = Date.now();

  const checkAbortAndIdle = async (): Promise<OllamaStreamFailure | null> => {
    if (await params.shouldAbort()) {
      return { kind: 'aborted' };
    }
    if (Date.now() - lastTokenAt > idleTimeoutMs) {
      return { kind: 'idle_timeout' };
    }
    return null;
  };

  try {
    for (;;) {
      const abortReason = await checkAbortAndIdle();
      if (abortReason) {
        await reader.cancel().catch(() => undefined);
        return { failure: abortReason };
      }

      const readPromise = reader.read();
      const timeoutPromise = new Promise<{ done: true; value: undefined }>((resolve) => {
        const wait = Math.max(250, idleTimeoutMs - (Date.now() - lastTokenAt));
        setTimeout(() => resolve({ done: true, value: undefined }), wait);
      });

      const raced = await Promise.race([readPromise, timeoutPromise]);
      if ('value' in raced && raced.done && raced.value === undefined && buffer.length === 0) {
        const idle = await checkAbortAndIdle();
        if (idle) {
          await reader.cancel().catch(() => undefined);
          return { failure: idle };
        }
        continue;
      }

      const chunk = raced as Awaited<typeof readPromise>;
      if (chunk.done) {
        break;
      }

      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        let payload: { message?: { content?: string }; done?: boolean };
        try {
          payload = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean };
        } catch {
          continue;
        }
        const token = payload.message?.content ?? '';
        if (token.length > 0) {
          fullText += token;
          lastTokenAt = Date.now();
          await params.onToken(token, fullText);
        }
        if (payload.done === true) {
          return { content: fullText.trim() };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { content: fullText.trim() };
}
