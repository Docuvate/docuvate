// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { DuplicateSetReviewCard } from '../components/documents/DuplicateSetReviewCard';
import { useDuplicateSetsInfiniteQuery } from '../lib/duplicates/useDuplicateSetsInfiniteQuery';
import { flattenCursorPages } from '../lib/pagination/useCursorInfiniteQuery';
import { useCursorLoadMoreSentinel } from '../lib/pagination/useCursorLoadMoreSentinel';

const DUPLICATE_ROW_ESTIMATE_PX = 280;

export function DuplicatesOverviewPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const setsQuery = useDuplicateSetsInfiniteQuery();
  const sets = flattenCursorPages(setsQuery.data?.pages);
  const loading = setsQuery.isLoading;

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: sets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => DUPLICATE_ROW_ESTIMATE_PX,
    overscan: 6,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  useCursorLoadMoreSentinel({
    containerRef: parentRef,
    hasNextPage: setsQuery.hasNextPage,
    isFetchingNextPage: setsQuery.isFetchingNextPage,
    fetchNextPage: () => {
      void setsQuery.fetchNextPage();
    },
  });

  function onResolved() {
    void queryClient.invalidateQueries({ queryKey: ['duplicate-sets'] });
  }

  return (
    <div className="page duplicates-overview-page" data-testid="duplicates-overview-page">
      <header className="page-header">
        <h1>{t('documents.duplicateQueueTitle')}</h1>
        <p className="muted">{t('documents.duplicateQueueLead')}</p>
      </header>
      {loading ? <p className="muted">{t('documents.duplicateQueueLoading')}</p> : null}
      {!loading && sets.length === 0 ? (
        <p className="muted">{t('documents.duplicateQueueEmpty')}</p>
      ) : null}
      {!loading && sets.length > 0 ? (
        <div
          ref={parentRef}
          className="duplicate-set-list duplicate-set-list-virtual"
          data-testid="duplicates-virtual-scroll"
        >
          <div
            className="duplicate-set-list-inner"
            style={{ height: `${String(virtualizer.getTotalSize())}px`, position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const set = sets[virtualRow.index];
              return (
                <div
                  key={set.setId}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="duplicate-set-virtual-row"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${String(virtualRow.start)}px)`,
                  }}
                >
                  <DuplicateSetReviewCard set={set} onResolved={onResolved} />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
