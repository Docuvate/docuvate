// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect, useRef } from 'react';
import type {
  DocumentChatMessageRecordDto,
  DocumentChatMessageStreamEvent,
} from '@docuvate/contracts';
import { apiBaseUrl, authHeaders, listLibraryChatThreadMessages } from './api';
import { CHAT_GENERATION_MAX_WAIT_SEC } from './chatGenerationLimits';

type MessageUpdater = (message: DocumentChatMessageRecordDto) => void;

function parseSseChunk(buffer: string): { events: DocumentChatMessageStreamEvent[]; rest: string } {
  const events: DocumentChatMessageStreamEvent[] = [];
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  for (const part of parts) {
    const line = part.split('\n').find((l) => l.startsWith('data:'));
    if (!line) continue;
    const json = line.slice(5).trim();
    if (!json) continue;
    try {
      events.push(JSON.parse(json) as DocumentChatMessageStreamEvent);
    } catch {
      /* ignore */
    }
  }
  return { events, rest };
}

export function useLibraryChatMessageStream(_threadId: string | null, onUpdate: MessageUpdater) {
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

  useEffect(() => () => stop(), [stop]);

  const connect = useCallback(
    (activeThreadId: string, messageId: string) => {
      stop();
      const url = `${apiBaseUrl()}/chat/threads/${activeThreadId}/messages/${messageId}/stream`;
      const controller = new AbortController();
      abortRef.current = controller;
      const startedAt = Date.now();

      void (async () => {
        try {
          const response = await fetch(url, {
            headers: authHeaders(),
            signal: controller.signal,
          });
          if (!response.ok || !response.body) {
            throw new Error('stream failed');
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parsed = parseSseChunk(buffer);
            buffer = parsed.rest;
            for (const event of parsed.events) {
              onUpdate(event.message);
            }
          }
          const refreshed = await listLibraryChatThreadMessages(activeThreadId);
          const finalMessage = refreshed.find((m) => m.id === messageId);
          if (finalMessage) {
            onUpdate(finalMessage);
          }
        } catch {
          pollingRef.current = setInterval(() => {
            if (Date.now() - startedAt > CHAT_GENERATION_MAX_WAIT_SEC * 1000) {
              stop();
              return;
            }
            void listLibraryChatThreadMessages(activeThreadId).then((messages) => {
              const hit = messages.find((m) => m.id === messageId);
              if (hit) onUpdate(hit);
              if (
                hit &&
                hit.generationStatus !== 'pending' &&
                hit.generationStatus !== 'streaming'
              ) {
                stop();
              }
            });
          }, 800);
        }
      })();
    },
    [onUpdate, stop]
  );

  return { connect, stop };
}
