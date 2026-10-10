// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatSsimScore,
  layoutCompareAdjacentPage,
  layoutCompareSliderStep,
  pngDataUrl,
} from '../../lib/layoutCompare';
import { useLayoutCompare } from '../../lib/useLayoutCompare';
import { LayoutComparePageNav } from './LayoutComparePageNav';

export type LayoutComparePresentation = 'split' | 'slider';

interface DocumentLayoutCompareViewProps {
  documentId: string;
  pageCount: number;
  activePage: number;
  onPageChange: (page: number) => void;
}

export function DocumentLayoutCompareView({
  documentId,
  pageCount,
  activePage,
  onPageChange,
}: DocumentLayoutCompareViewProps) {
  const { t, i18n } = useTranslation();
  const [presentation, setPresentation] = useState<LayoutComparePresentation>('split');
  const [sliderPos, setSliderPos] = useState(50);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  const {
    metrics,
    metricsState,
    metricsError,
    metricsByPage,
    pagePayload,
    pageState,
    pageError,
    loadPage,
  } = useLayoutCompare(documentId, true, pageCount, activePage);

  useEffect(() => {
    void loadPage(activePage, heatmapEnabled);
  }, [activePage, heatmapEnabled, loadPage]);

  const ssimFloor = pagePayload?.ssimFloor ?? metrics?.ssimFloor ?? 0;
  const ssimScore = pagePayload?.ssim ?? metricsByPage.get(activePage)?.ssim;
  const pageReliable =
    pagePayload?.pageReliable ?? metricsByPage.get(activePage)?.pageReliable ?? true;

  const originalSrc = pagePayload ? pngDataUrl(pagePayload.originalPngBase64) : '';
  const reconstructionSrc = pagePayload ? pngDataUrl(pagePayload.reconstructionPngBase64) : '';
  const heatmapSrc =
    pagePayload?.heatmapPngBase64 ? pngDataUrl(pagePayload.heatmapPngBase64) : '';

  const onSliderKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const next = layoutCompareSliderStep(event.key, sliderPos);
    if (next === null) return;
    event.preventDefault();
    setSliderPos(next);
  };

  const onCompareKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement && event.target.type === 'range') {
      return;
    }
    const next = layoutCompareAdjacentPage(event.key, activePage, pageCount);
    if (next === null) return;
    event.preventDefault();
    onPageChange(next);
  };

  return (
    <div className="layout-compare" tabIndex={0} onKeyDown={onCompareKeyDown}>
      <div className="layout-compare-toolbar">
        <div className="layout-compare-mode-switch" role="group" aria-label={t('documents.layoutCompareModeAria')}>
          <button
            type="button"
            className={`layout-view-mode-btn${presentation === 'split' ? ' layout-view-mode-btn-active' : ''}`}
            aria-pressed={presentation === 'split'}
            onClick={() => setPresentation('split')}
          >
            {t('documents.layoutCompareSplit')}
          </button>
          <button
            type="button"
            className={`layout-view-mode-btn${presentation === 'slider' ? ' layout-view-mode-btn-active' : ''}`}
            aria-pressed={presentation === 'slider'}
            onClick={() => setPresentation('slider')}
          >
            {t('documents.layoutCompareSlider')}
          </button>
        </div>
        <label className="layout-overlay-toggle">
          <input
            type="checkbox"
            checked={heatmapEnabled}
            onChange={(event) => setHeatmapEnabled(event.target.checked)}
          />
          <span>{t('documents.layoutCompareHeatmap')}</span>
        </label>
        <div className="layout-compare-ssim-summary" role="status">
          {ssimScore != null ? (
            <span>
              {t('documents.layoutCompareSsim', {
                score: formatSsimScore(ssimScore, i18n.language),
              })}
            </span>
          ) : (
            <span className="muted">{t('documents.layoutCompareSsimPending')}</span>
          )}
          <span className="muted layout-compare-ssim-floor">
            {t('documents.layoutCompareSsimFloor', {
              floor: formatSsimScore(ssimFloor, i18n.language),
            })}
          </span>
          {!pageReliable ? (
            <span className="layout-compare-ssim-warn">{t('documents.layoutCompareUnreliablePage')}</span>
          ) : null}
        </div>
      </div>

      <LayoutComparePageNav
        pageCount={pageCount}
        activePage={activePage}
        metricsByPage={metricsByPage}
        onPageChange={onPageChange}
      />

      {metricsState === 'error' ? (
        <p className="error" role="alert">{metricsError}</p>
      ) : null}
      {pageState === 'error' ? (
        <p className="error" role="alert">{pageError}</p>
      ) : null}
      {pageState === 'loading' || metricsState === 'loading' ? (
        <p className="muted">{t('documents.layoutCompareLoading')}</p>
      ) : null}

      {originalSrc && reconstructionSrc ? (
        <div
          className={`layout-compare-stage layout-compare-stage-${presentation}`}
          data-testid="layout-compare-stage"
        >
          {presentation === 'split' ? (
            <div className="layout-compare-split">
              <figure className="layout-compare-pane">
                <figcaption>{t('documents.layoutViewOriginal')}</figcaption>
                <img src={originalSrc} alt={t('documents.layoutCompareOriginalAlt', { page: activePage })} />
                {heatmapEnabled && heatmapSrc ? (
                  <img
                    className="layout-compare-heatmap"
                    src={heatmapSrc}
                    alt=""
                    aria-hidden
                  />
                ) : null}
              </figure>
              <figure className="layout-compare-pane">
                <figcaption>{t('documents.layoutViewReconstruction')}</figcaption>
                <img
                  src={reconstructionSrc}
                  alt={t('documents.layoutCompareReconstructionAlt', { page: activePage })}
                />
              </figure>
            </div>
          ) : (
            <div className="layout-compare-slider">
              <img
                className="layout-compare-slider-base"
                src={originalSrc}
                alt={t('documents.layoutCompareOriginalAlt', { page: activePage })}
              />
              <div
                className="layout-compare-slider-reveal"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={reconstructionSrc}
                  alt={t('documents.layoutCompareReconstructionAlt', { page: activePage })}
                />
              </div>
              {heatmapEnabled && heatmapSrc ? (
                <img className="layout-compare-heatmap" src={heatmapSrc} alt="" aria-hidden />
              ) : null}
              <input
                type="range"
                className="layout-compare-slider-input"
                min={0}
                max={100}
                value={sliderPos}
                aria-valuenow={sliderPos}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('documents.layoutCompareSliderAria')}
                onChange={(event) => setSliderPos(Number(event.target.value))}
                onKeyDown={onSliderKeyDown}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
