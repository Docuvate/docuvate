// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentChatMessageRecordDto,
  DocumentChatMessageStreamEvent,
} from '@docuvate/contracts';

import { isRecord } from './apiErrors';

export function isDocumentChatMessageStreamEvent(
  value: unknown
): value is DocumentChatMessageStreamEvent {
  return isRecord(value) && typeof value.type === 'string';
}

export function parseDocumentChatMessageStreamEventJson(
  json: string
): DocumentChatMessageStreamEvent | null {
  try {
    const parsed: unknown = JSON.parse(json);
    return isDocumentChatMessageStreamEvent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseSseChatStreamChunk(buffer: string): {
  events: DocumentChatMessageStreamEvent[];
  rest: string;
} {
  const events: DocumentChatMessageStreamEvent[] = [];
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  for (const part of parts) {
    const line = part.split('\n').find((l) => l.startsWith('data:'));
    if (!line) {
      continue;
    }
    const json = line.slice(5).trim();
    if (!json) {
      continue;
    }
    const event = parseDocumentChatMessageStreamEventJson(json);
    if (event) {
      events.push(event);
    }
  }
  return { events, rest };
}

export function readChatMessagesFromListResponse(
  value: unknown
): DocumentChatMessageRecordDto[] {
  if (!isRecord(value) || !Array.isArray(value.messages)) {
    return [];
  }
  return value.messages.filter(
    (item): item is DocumentChatMessageRecordDto =>
      isRecord(item) && typeof item.id === 'string'
  );
}
