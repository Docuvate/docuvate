// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CURSOR_LIST_DEFAULT_LIMIT, type DuplicateSetDto } from '@docuvate/contracts';
import { useMemo } from 'react';

import { listDuplicateSetsPage } from '../api';
import { useCursorInfiniteQuery } from '../pagination/useCursorInfiniteQuery';

export interface DuplicateSetsQueryParams {
  documentId?: string;
}

export function useDuplicateSetsInfiniteQuery(params: DuplicateSetsQueryParams = {}) {
  const documentId = params.documentId;
  const queryKey = useMemo(
    () => ['duplicate-sets', documentId ?? null] as const,
    [documentId]
  );

  return useCursorInfiniteQuery<DuplicateSetDto, DuplicateSetsQueryParams>({
    queryKey,
    extraParams: params,
    defaultLimit: CURSOR_LIST_DEFAULT_LIMIT,
    fetchPage: ({ limit, cursor, documentId: docId }) =>
      listDuplicateSetsPage({ documentId: docId, limit, cursor }),
  });
}
