// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentTagSuggestionsBatchResponseDto, TagSuggestionDto } from '@docuvate/contracts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchDocumentTagSuggestionsBatch } from '../api';

export function libraryDocumentTagSuggestionsQueryKey(documentIds: string[]): readonly string[] {
  const sorted = [...documentIds].sort();
  return ['library', 'documentTagSuggestions', sorted.join(',')];
}

export function useLibraryDocumentTagSuggestions(
  documentIds: string[]
): {
  suggestionsByDocumentId: Record<string, TagSuggestionDto[]>;
  isFetching: boolean;
} {
  const stableIds = useMemo(() => [...new Set(documentIds)], [documentIds]);
  const query = useQuery<DocumentTagSuggestionsBatchResponseDto>({
    queryKey: libraryDocumentTagSuggestionsQueryKey(stableIds),
    queryFn: () => fetchDocumentTagSuggestionsBatch(stableIds),
    enabled: stableIds.length > 0,
    staleTime: 30_000,
  });

  const suggestionsByDocumentId = useMemo(() => {
    const map: Record<string, TagSuggestionDto[]> = {};
    for (const item of query.data?.items ?? []) {
      map[item.documentId] = item.suggestions;
    }
    return map;
  }, [query.data?.items]);

  return { suggestionsByDocumentId, isFetching: query.isFetching };
}
