// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CURSOR_LIST_DEFAULT_LIMIT, type DocumentReviewQueueItemDto } from '@docuvate/contracts';

import { listDocumentReviewQueuePage } from '../api';
import { useCursorInfiniteQuery } from '../pagination/useCursorInfiniteQuery';

export function useDocumentReviewQueueInfiniteQuery() {
  return useCursorInfiniteQuery<DocumentReviewQueueItemDto, Record<string, never>>({
    queryKey: ['document-review-queue'],
    extraParams: {},
    defaultLimit: CURSOR_LIST_DEFAULT_LIMIT,
    fetchPage: ({ limit, cursor }) => listDocumentReviewQueuePage({ limit, cursor }),
  });
}
