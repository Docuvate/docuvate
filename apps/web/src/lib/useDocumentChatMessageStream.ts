// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatMessageRecordDto } from '@docuvate/contracts';
import { useCallback, useEffect, useRef } from 'react';

import { apiBaseUrl, authHeaders, listDocumentChatThreadMessages } from './api';
import { CHAT_GENERATION_MAX_WAIT_SEC } from './chatGenerationLimits';
import { isTerminalGenerationStatus } from './chatGenerationTerminal';
import { parseSseChatStreamChunk } from './chatStreamParse';

type MessageUpdater = (message: DocumentChatMessageRecordDto) => void;

function isGenerationSettled(message: DocumentChatMessageRecordDto | undefined): boolean {
  if (!message) {
    return false;
  }
  const status = message.generationStatus ?? 'done';
  return isTerminalGenerationStatus(status);
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
      if (!threadId) {
        return;
      }
      stop();
      const startedAt = Date.now();
      const poll = async () => {
        if (Date.now() - startedAt > CHAT_GENERATION_MAX_WAIT_SEC * 1000) {
          stop();
          return;
        }
        try {
          const messages = await listDocumentChatThreadMessages(documentId, threadId);
          const message = messages.find((m) => m.id === messageId);
          if (message) {
            onUpdate(message);
            if (isGenerationSettled(message)) {
              stop();
            }
          }
        } catch {
          /* retry on next tick */
        }
      };
      void poll();
      pollingRef.current = setInterval(() => void poll(), 800);
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
      const startedAt = Date.now();

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

          for (;;) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const parsed = parseSseChatStreamChunk(buffer);
            buffer = parsed.rest;
            for (const event of parsed.events) {
              onUpdate(event.message);
              if (event.type === 'done' || event.type === 'failed' || event.type === 'cancelled') {
                stop();
                return;
              }
            }
          }

          const refreshed = await listDocumentChatThreadMessages(documentId, threadId);
          const finalMessage = refreshed.find((m) => m.id === messageId);
          if (finalMessage) {
            onUpdate(finalMessage);
          }
          if (!isGenerationSettled(finalMessage)) {
            startPolling(messageId);
          }
        } catch {
          if (!controller.signal.aborted) {
            if (Date.now() - startedAt > CHAT_GENERATION_MAX_WAIT_SEC * 1000) {
              stop();
              return;
            }
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
