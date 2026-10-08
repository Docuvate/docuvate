import { useCallback, useEffect, useRef } from 'react';
import type {
  DocumentChatMessageRecordDto,
  DocumentChatMessageStreamEvent,
} from '@docuvate/contracts';
import { apiBaseUrl, authHeaders } from './api';

type MessageUpdater = (message: DocumentChatMessageRecordDto) => void;

function parseSseChunk(buffer: string): { events: DocumentChatMessageStreamEvent[]; rest: string } {
  const events: DocumentChatMessageStreamEvent[] = [];
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  for (const part of parts) {
    const line = part
      .split('\n')
      .find((l) => l.startsWith('data:'));
    if (!line) {
      continue;
    }
    const json = line.slice(5).trim();
    if (!json) {
      continue;
    }
    try {
      events.push(JSON.parse(json) as DocumentChatMessageStreamEvent);
    } catch {
      /* ignore malformed chunks */
    }
  }
  return { events, rest };
}

export function useDocumentChatMessageStream(
  documentId: string,
  threadId: string | null,
  onUpdate: MessageUpdater
) {
  const abortRef = useRef<AbortController | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (messageId: string) => {
      stop();
      const poll = async () => {
        try {
          const res = await fetch(
            `${apiBaseUrl()}/documents/${documentId}/chat/threads/${threadId}/messages`,
            { credentials: 'include', headers: authHeaders() }
          );
          if (!res.ok) {
            return;
          }
          const data = (await res.json()) as { messages: DocumentChatMessageRecordDto[] };
          const message = data.messages.find((m) => m.id === messageId);
          if (message) {
            onUpdate(message);
            if (
              message.generationStatus === 'done' ||
              message.generationStatus === 'failed'
            ) {
              stop();
            }
          }
        } catch {
          /* retry on next tick */
        }
      };
      void poll();
      pollingRef.current = setInterval(() => void poll(), 1200);
    },
    [documentId, onUpdate, stop, threadId]
  );

  const connect = useCallback(
    (messageId: string) => {
      if (!threadId) {
        return;
      }
      stop();
      const controller = new AbortController();
      abortRef.current = controller;

      const url = `${apiBaseUrl()}/documents/${documentId}/chat/threads/${threadId}/messages/${messageId}/stream`;

      void (async () => {
        try {
          const response = await fetch(url, {
            credentials: 'include',
            headers: {
              ...authHeaders(),
              Accept: 'text/event-stream',
            },
            signal: controller.signal,
          });
          if (!response.ok || !response.body) {
            startPolling(messageId);
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const parsed = parseSseChunk(buffer);
            buffer = parsed.rest;
            for (const event of parsed.events) {
              onUpdate(event.message);
              if (
                event.type === 'done' ||
                event.type === 'failed' ||
                event.type === 'cancelled'
              ) {
                stop();
                return;
              }
            }
          }
        } catch {
          if (!controller.signal.aborted) {
            startPolling(messageId);
          }
        }
      })();
    },
    [documentId, onUpdate, startPolling, stop, threadId]
  );

  useEffect(() => stop, [stop]);

  return { connect, stop };
}
