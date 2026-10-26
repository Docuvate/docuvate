// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CURSOR_LIST_DEFAULT_LIMIT, type SavedDocumentViewDto } from '@docuvate/contracts';

import { listSavedDocumentViewsPage } from '../api';
import { useCursorInfiniteQuery } from '../pagination/useCursorInfiniteQuery';

export function useSavedDocumentViewsInfiniteQuery() {
  return useCursorInfiniteQuery<SavedDocumentViewDto, Record<string, never>>({
    queryKey: ['saved-document-views'],
    extraParams: {},
    defaultLimit: CURSOR_LIST_DEFAULT_LIMIT,
    fetchPage: ({ limit, cursor }) => listSavedDocumentViewsPage({ limit, cursor }),
  });
}
