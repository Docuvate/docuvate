// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  TAG_SEARCH_DEFAULT_LIMIT,
  type TagDto,
  type TagSearchPageDto,
} from '@docuvate/contracts';
import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { searchTagsPage } from '../api';

export function tagSearchQueryKey(q: string): readonly ['tags', 'search', string] {
  return ['tags', 'search', q];
}

export function flattenTagSearchPages(
  pages: TagSearchPageDto[] | undefined
): { tags: TagDto[]; hasMore: boolean; total: number | null } {
  if (!pages?.length) {
    return { tags: [], hasMore: false, total: null };
  }
  const seen = new Set<string>();
  const tags: TagDto[] = [];
  for (const page of pages) {
    for (const tag of page.items) {
      if (seen.has(tag.id)) {
        continue;
      }
      seen.add(tag.id);
      tags.push(tag);
    }
  }
  const last = pages[pages.length - 1];
  return { tags, hasMore: last.hasMore, total: pages[0]?.total ?? null };
}

export function useTagSearchInfiniteQuery(searchQuery: string, enabled: boolean) {
  const normalized = searchQuery.trim();
  const queryKey = useMemo(() => tagSearchQueryKey(normalized), [normalized]);

  return useInfiniteQuery<
    TagSearchPageDto,
    Error,
    InfiniteData<TagSearchPageDto, string | undefined>,
    readonly ['tags', 'search', string],
    string | undefined
  >({
    queryKey,
    enabled,
    staleTime: 30_000,
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) =>
      searchTagsPage({
        q: normalized.length > 0 ? normalized : undefined,
        cursor: pageParam,
        limit: TAG_SEARCH_DEFAULT_LIMIT,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
}
