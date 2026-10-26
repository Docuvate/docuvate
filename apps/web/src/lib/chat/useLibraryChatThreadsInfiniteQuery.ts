// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CURSOR_LIST_DEFAULT_LIMIT, type DocumentChatThreadDto } from '@docuvate/contracts';

import { listLibraryChatThreadsPage } from '../api';
import { useCursorInfiniteQuery } from '../pagination/useCursorInfiniteQuery';

export function useLibraryChatThreadsInfiniteQuery(enabled = true) {
  return useCursorInfiniteQuery<DocumentChatThreadDto, Record<string, never>>({
    queryKey: ['library-chat-threads'],
    enabled,
    extraParams: {},
    defaultLimit: CURSOR_LIST_DEFAULT_LIMIT,
    fetchPage: async ({ limit, cursor }) => {
      const data = await listLibraryChatThreadsPage({ limit, cursor });
      return {
        items: data.threads,
        nextCursor: data.nextCursor,
        hasMore: data.hasMore,
        total: data.total,
      };
    },
  });
}
