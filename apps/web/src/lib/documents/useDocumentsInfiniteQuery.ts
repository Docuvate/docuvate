// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  DOCUMENT_LIST_DEFAULT_LIMIT,
  type DocumentDto,
  type DocumentListQuery,
  type DocumentListResponseDto,
} from '@docuvate/contracts';
import { useMemo } from 'react';

import { listDocumentsPage } from '../api';
import { useCursorInfiniteQuery } from '../pagination/useCursorInfiniteQuery';
import { documentListQueryKey } from './documentListQueryKey';

export type DocumentsInfinitePage = DocumentListResponseDto;

export function useDocumentsInfiniteQuery(filters: DocumentListQuery | null) {
  const queryKey = useMemo(() => documentListQueryKey(filters), [filters]);

  return useCursorInfiniteQuery<
    DocumentDto,
    DocumentListQuery,
    DocumentListResponseDto
  >({
    queryKey,
    enabled: filters !== null,
    extraParams: filters ?? {},
    defaultLimit: DOCUMENT_LIST_DEFAULT_LIMIT,
    getLimit: (params) => params.limit ?? DOCUMENT_LIST_DEFAULT_LIMIT,
    fetchPage: async (params) => {
      if (filters === null) {
        return { items: [], nextCursor: null, hasMore: false, total: null };
      }
      return listDocumentsPage({
        ...filters,
        cursor: params.cursor,
        limit: params.limit,
      });
    },
  });
}

export function flattenDocumentPages(
  pages: DocumentsInfinitePage[] | undefined
): DocumentDto[] {
  if (!pages?.length) {
    return [];
  }
  const seen = new Set<string>();
  const merged: DocumentDto[] = [];
  for (const page of pages) {
    for (const item of page.items) {
      if (seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}
