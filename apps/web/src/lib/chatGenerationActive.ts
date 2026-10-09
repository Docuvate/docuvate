// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatMessageRecordDto } from '@docuvate/contracts';

export function isAssistantGenerationActive(message: DocumentChatMessageRecordDto): boolean {
  return (
    message.role === 'assistant' &&
    (message.generationStatus === 'pending' || message.generationStatus === 'streaming')
  );
}

/** True when the composer should stay disabled for an in-flight generation on the loaded thread. */
export function isChatGenerationInProgress(
  messages: DocumentChatMessageRecordDto[],
  loadingMessages: boolean
): boolean {
  if (loadingMessages) {
    return false;
  }
  return messages.some(isAssistantGenerationActive);
}

export function threadListShowsGenerationSpinner(
  thread: { activeGenerationStatus?: string | null }
): boolean {
  return (
    thread.activeGenerationStatus === 'pending' || thread.activeGenerationStatus === 'streaming'
  );
}
