// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import { type RefObject, useEffect, useRef } from 'react';

interface LibraryDocumentVirtualizerOptions {
  count: number;
  estimateSize: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  scrollStorageKey?: string;
}

export function useLibraryDocumentVirtualizer(options: LibraryDocumentVirtualizerOptions): {
  parentRef: RefObject<HTMLDivElement>;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
} {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: options.count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => options.estimateSize,
    overscan: 14,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const scrollStorageKey = options.scrollStorageKey;
  useEffect(() => {
    const el = parentRef.current;
    if (!el || !scrollStorageKey) {
      return;
    }
    const stored = sessionStorage.getItem(scrollStorageKey);
    if (stored) {
      const top = Number(stored);
      if (Number.isFinite(top)) {
        el.scrollTop = top;
      }
    }
    const onScroll = () => {
      sessionStorage.setItem(scrollStorageKey, String(el.scrollTop));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, [scrollStorageKey]);

  const { count, hasNextPage, isFetchingNextPage, onLoadMore } = options;
  const endIndex = virtualizer.range?.endIndex ?? 0;
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !onLoadMore) {
      return;
    }
    if (endIndex >= count - 10) {
      onLoadMore();
    }
  }, [count, endIndex, hasNextPage, isFetchingNextPage, onLoadMore]);

  return { parentRef, virtualizer };
}
