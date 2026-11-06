// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { SavedDocumentViewDto } from '@docuvate/contracts';
import { useEffect, useMemo } from 'react';

import { flattenCursorPages } from '../pagination/useCursorInfiniteQuery';
import { SAVED_VIEWS_CHANGED } from '../savedViewsEvents';
import { useSavedDocumentViewsInfiniteQuery } from './useSavedDocumentViewsInfiniteQuery';

/** Saved views pinned for quick access, in their stored order; refreshes when views change. */
export function usePinnedSavedViews(): SavedDocumentViewDto[] {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useSavedDocumentViewsInfiniteQuery();
  const allViews = useMemo(() => flattenCursorPages(data?.pages), [data?.pages]);

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const onChanged = () => {
      void refetch();
    };
    window.addEventListener(SAVED_VIEWS_CHANGED, onChanged);
    return () => {
      window.removeEventListener(SAVED_VIEWS_CHANGED, onChanged);
    };
  }, [refetch]);

  return useMemo(
    () => allViews.filter((v) => v.pinnedSidebar).sort((a, b) => a.position - b.position),
    [allViews]
  );
}
