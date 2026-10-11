// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatGenerationStatus } from '@docuvate/contracts';

export function isTerminalGenerationStatus(
  status: DocumentChatGenerationStatus | null | undefined
): boolean {
  return status === 'done' || status === 'failed';
}
