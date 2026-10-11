// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatThreadDto } from '@docuvate/contracts';

import { threadListShowsGenerationSpinner } from './chatGenerationActive';

/** Hide stale thread-list spinners when the active thread's messages are already terminal. */
export function showThreadListSpinner(
  thread: DocumentChatThreadDto,
  activeThreadId: string | null,
  activeThreadGenerationInProgress: boolean
): boolean {
  if (thread.id === activeThreadId && !activeThreadGenerationInProgress) {
    return false;
  }
  return threadListShowsGenerationSpinner(thread);
}
