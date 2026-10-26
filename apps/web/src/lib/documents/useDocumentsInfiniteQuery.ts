// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  DOCUMENT_LIST_DEFAULT_LIMIT,
  type DocumentDto,
  type DocumentListQuery,
} from '@docuvate/contracts';
import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { listDocumentsPage } from '../api';
import { documentListQueryKey } from './documentListQueryKey';

export interface DocumentsInfinitePage {
  items: DocumentDto[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number | null;
}

export function useDocumentsInfiniteQuery(filters: DocumentListQuery | null) {
  const queryKey = useMemo(() => documentListQueryKey(filters), [filters]);

  return useInfiniteQuery<
    DocumentsInfinitePage,
    Error,
    InfiniteData<DocumentsInfinitePage, string | undefined>,
    readonly unknown[],
    string | undefined
  >({
    queryKey,
    enabled: filters !== null,
    staleTime: 30_000,
    refetchOnMount: false,
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      if (filters === null) {
        return { items: [], nextCursor: null, hasMore: false, total: null };
      }
      return listDocumentsPage({
        ...filters,
        cursor: pageParam,
        limit: filters.limit ?? DOCUMENT_LIST_DEFAULT_LIMIT,
      });
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
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
