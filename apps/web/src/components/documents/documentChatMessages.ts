// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatMessageRecordDto } from '@docuvate/contracts';

/** Merge server messages after send; avoids duplicate user rows when a stale list fetch races the POST. */
export function mergeThreadMessagesAfterSend(
  prev: DocumentChatMessageRecordDto[],
  optimisticId: string,
  userMessage: DocumentChatMessageRecordDto,
  assistantMessage: DocumentChatMessageRecordDto
): DocumentChatMessageRecordDto[] {
  const withoutPending = optimisticId
    ? prev.filter((m) => m.id !== optimisticId && !m.id.startsWith('pending-'))
    : prev;
  const withoutDupes = withoutPending.filter(
    (m) => m.id !== userMessage.id && m.id !== assistantMessage.id
  );
  return [...withoutDupes, userMessage, assistantMessage];
}
