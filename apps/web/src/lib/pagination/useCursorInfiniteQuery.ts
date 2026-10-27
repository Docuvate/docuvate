// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CursorListResponse } from '@docuvate/contracts';
import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';

export type CursorInfinitePage<Item> = CursorListResponse<Item>;

export function flattenCursorPages<Item>(
  pages: CursorInfinitePage<Item>[] | undefined
): Item[] {
  if (!pages?.length) {
    return [];
  }
  return pages.flatMap((page) => page.items);
}

export interface CursorInfiniteQueryOptions<
  Item,
  ExtraParams,
  Page extends CursorInfinitePage<Item> = CursorInfinitePage<Item>,
> {
  queryKey: readonly unknown[];
  enabled?: boolean;
  extraParams: ExtraParams;
  defaultLimit: number;
  fetchPage: (params: ExtraParams & { limit: number; cursor?: string }) => Promise<Page>;
  getLimit?: (extraParams: ExtraParams) => number;
}

export function useCursorInfiniteQuery<
  Item,
  ExtraParams,
  Page extends CursorInfinitePage<Item> = CursorInfinitePage<Item>,
>(options: CursorInfiniteQueryOptions<Item, ExtraParams, Page>) {
  const limit = options.getLimit?.(options.extraParams) ?? options.defaultLimit;

  return useInfiniteQuery<
    Page,
    Error,
    InfiniteData<Page, string | undefined>,
    readonly unknown[],
    string | undefined
  >({
    queryKey: options.queryKey,
    enabled: options.enabled ?? true,
    staleTime: 30_000,
    refetchOnMount: false,
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) =>
      options.fetchPage({
        ...options.extraParams,
        limit,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
}
