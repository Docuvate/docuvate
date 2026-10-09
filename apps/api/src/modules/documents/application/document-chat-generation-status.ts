// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatGenerationStatus } from '../../../shared/domain/ports.js';

export function isTerminalGenerationStatus(
  status: DocumentChatGenerationStatus | null | undefined
): boolean {
  return status === 'done' || status === 'failed';
}

export function isActiveGenerationStatus(
  status: DocumentChatGenerationStatus | null | undefined
): boolean {
  return status === 'pending' || status === 'streaming';
}

export function normalizeLegacyAssistantStatus(
  status: DocumentChatGenerationStatus | null | undefined
): DocumentChatGenerationStatus | null {
  if (status == null) {
    return 'done';
  }
  return status;
}
