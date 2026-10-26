// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  RECOGNIZED_FIELD_FILTER_VALUES_DEFAULT_LIMIT,
  type RecognizedFieldFilterValuesPageDto,
} from '@docuvate/contracts';
import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';

import { searchRecognizedFieldFilterValuesPage } from '../api';

export function fieldFilterValueQueryKey(
  fieldKey: string,
  q: string
): readonly ['recognized-field-values', string, string] {
  return ['recognized-field-values', fieldKey, q];
}

export function useFieldFilterValueSearch(fieldKey: string, searchQuery: string, enabled: boolean) {
  const normalized = searchQuery.trim();
  return useInfiniteQuery<
    RecognizedFieldFilterValuesPageDto,
    Error,
    InfiniteData<RecognizedFieldFilterValuesPageDto, string | undefined>,
    readonly ['recognized-field-values', string, string],
    string | undefined
  >({
    queryKey: fieldFilterValueQueryKey(fieldKey, normalized),
    enabled: enabled && fieldKey.trim().length > 0,
    staleTime: 30_000,
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) =>
      searchRecognizedFieldFilterValuesPage({
        key: fieldKey,
        q: normalized.length > 0 ? normalized : undefined,
        cursor: pageParam,
        limit: RECOGNIZED_FIELD_FILTER_VALUES_DEFAULT_LIMIT,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
}
