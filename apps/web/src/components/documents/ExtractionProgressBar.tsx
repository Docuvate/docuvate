// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { DocumentDto } from '@docuvate/contracts';
import { isExtractionPending } from '../../lib/documentExtractionState';
import { extractionProgressSnapshot } from '../../lib/extractionProgress';

interface ExtractionProgressBarProps {
  doc: Pick<DocumentDto, 'status' | 'extraction' | 'tags' | 'tagSuggestions' | 'id'>;
  compact?: boolean;
  className?: string;
}

interface ProgressStore {
  docId: string;
  status: DocumentDto['status'];
  percent: number;
}

export function ExtractionProgressBar({
  doc,
  compact = false,
  className,
}: ExtractionProgressBarProps) {
  const { t } = useTranslation();
  const snapshot = extractionProgressSnapshot(doc);
  const storeRef = useRef<ProgressStore>({ docId: '', status: doc.status, percent: 0 });
  const store = storeRef.current;

  if (store.docId !== doc.id) {
    store.docId = doc.id;
    store.status = doc.status;
    store.percent = 0;
  } else if (store.status !== doc.status) {
    if (!isExtractionPending(store.status) && isExtractionPending(doc.status)) {
      store.percent = 0;
    }
    store.status = doc.status;
  }

  if (snapshot) {
    store.percent = Math.max(store.percent, snapshot.percent);
  }

  if (!snapshot) {
    return null;
  }

  const displayPercent = store.percent;

  const rootClass = [
    'extraction-progress',
    compact ? 'extraction-progress-compact' : '',
    snapshot.indeterminate ? 'extraction-progress-indeterminate' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const ariaValueNow = snapshot.indeterminate ? undefined : displayPercent;

  return (
    <div className={rootClass}>
      {!compact ? (
        <div className="extraction-progress-head">
          <span className="extraction-progress-stage">{snapshot.stageLabel}</span>
          <span className="muted extraction-progress-meta">
            {snapshot.stepLabel}
            <span
              className="extraction-progress-estimate"
              title={t('extraction.progressEstimateTitle')}
            >
              {' '}
              · {t('extraction.progressEstimate')}
            </span>
          </span>
        </div>
      ) : (
        <span className="sr-only">
          {t('extraction.progressCompactAria', {
            stage: snapshot.stageLabel,
            step: snapshot.stepLabel,
            percent: displayPercent,
          })}
        </span>
      )}
      <div
        className="extraction-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={ariaValueNow}
        aria-valuetext={
          snapshot.indeterminate
            ? t('extraction.progressIndeterminateAria', { stage: snapshot.stageLabel })
            : t('extraction.progressDeterminateAria', {
                stage: snapshot.stageLabel,
                percent: displayPercent,
              })
        }
        aria-busy={snapshot.indeterminate ? true : undefined}
      >
        <div
          className="extraction-progress-fill"
          style={snapshot.indeterminate ? undefined : { width: `${displayPercent}%` }}
        />
      </div>
      {compact ? (
        <span
          className="extraction-progress-compact-label muted"
          title={snapshot.stageLabel}
          aria-hidden
        >
          {snapshot.stageLabel}
        </span>
      ) : null}
    </div>
  );
}
