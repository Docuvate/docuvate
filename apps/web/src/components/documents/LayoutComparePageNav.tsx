// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useMemo, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LAYOUT_COMPARE_VIRTUAL_PAGE_THRESHOLD,
  layoutCompareAdjacentPage,
  layoutCompareVisiblePageRange,
  type LayoutComparePageMetric,
} from '../../lib/layoutCompare';
import { Button } from '../ui/Button';

interface LayoutComparePageNavProps {
  pageCount: number;
  activePage: number;
  metricsByPage: Map<number, LayoutComparePageMetric>;
  onPageChange: (page: number) => void;
}

export function LayoutComparePageNav({
  pageCount,
  activePage,
  metricsByPage,
  onPageChange,
}: LayoutComparePageNavProps) {
  const { t, i18n } = useTranslation();
  const { start, end } = useMemo(
    () => layoutCompareVisiblePageRange(pageCount, activePage),
    [pageCount, activePage]
  );

  const pageNumbers = useMemo(() => {
    const list: number[] = [];
    for (let p = start; p <= end; p += 1) {
      list.push(p);
    }
    return list;
  }, [start, end]);

  const virtualized = pageCount > LAYOUT_COMPARE_VIRTUAL_PAGE_THRESHOLD;

  const onStripKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = layoutCompareAdjacentPage(event.key, activePage, pageCount);
    if (next === null) return;
    event.preventDefault();
    onPageChange(next);
  };

  return (
    <nav className="layout-compare-page-nav" aria-label={t('documents.layoutComparePageNavAria')}>
      <div className="layout-compare-page-nav-controls">
        <Button
          type="button"
          variant="ghost"
          disabled={activePage <= 1}
          onClick={() => onPageChange(activePage - 1)}
        >
          {t('documents.layoutComparePagePrev')}
        </Button>
        <label className="layout-compare-page-jump">
          <span className="visually-hidden">{t('documents.layoutComparePageJump')}</span>
          <input
            type="number"
            min={1}
            max={pageCount}
            value={activePage}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              if (!Number.isFinite(next)) return;
              if (next < 1) return;
              if (next > pageCount) return;
              onPageChange(next);
            }}
          />
          <span className="muted layout-compare-page-jump-total">
            {t('documents.layoutComparePageOf', { page: activePage, total: pageCount })}
          </span>
        </label>
        <Button
          type="button"
          variant="ghost"
          disabled={activePage >= pageCount}
          onClick={() => onPageChange(activePage + 1)}
        >
          {t('documents.layoutComparePageNext')}
        </Button>
      </div>
      <div
        className={`layout-compare-page-strip${virtualized ? ' layout-compare-page-strip-virtual' : ''}`}
        role="listbox"
        tabIndex={0}
        aria-label={t('documents.layoutComparePageStripAria')}
        aria-activedescendant={`layout-compare-page-chip-${activePage}`}
        onKeyDown={onStripKeyDown}
      >
        {virtualized ? (
          <span className="muted layout-compare-page-strip-hint">
            {t('documents.layoutCompareVirtualHint', { start, end, total: pageCount })}
          </span>
        ) : null}
        {pageNumbers.map((pageNumber) => {
          const metric = metricsByPage.get(pageNumber);
          const selected = pageNumber === activePage;
          const reliable = metric?.pageReliable;
          return (
            <button
              key={pageNumber}
              id={`layout-compare-page-chip-${pageNumber}`}
              type="button"
              role="option"
              aria-selected={selected}
              className={`layout-compare-page-chip${selected ? ' layout-compare-page-chip-active' : ''}${
                metric && reliable === false ? ' layout-compare-page-chip-warn' : ''
              }`}
              onClick={() => onPageChange(pageNumber)}
            >
              <span>{pageNumber}</span>
              {metric?.ssim != null ? (
                <span className="layout-compare-page-chip-ssim">
                  {new Intl.NumberFormat(i18n.language, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(metric.ssim * 100)}
                  %
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
