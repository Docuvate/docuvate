// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type RefObject, useEffect } from 'react';

export function useCursorLoadMoreSentinel(options: {
  containerRef: RefObject<HTMLElement | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  thresholdPx?: number;
}): void {
  const { containerRef, hasNextPage, isFetchingNextPage, fetchNextPage, thresholdPx = 240 } =
    options;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const onScroll = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (remaining <= thresholdPx) {
        fetchNextPage();
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, [containerRef, fetchNextPage, hasNextPage, isFetchingNextPage, thresholdPx]);
}
