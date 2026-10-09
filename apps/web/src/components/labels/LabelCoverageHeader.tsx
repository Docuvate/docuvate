// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { LabelMapCoverageSummaryDto, LabelMapEmptyReason } from '@docuvate/contracts';
import { routes } from '../../lib/routes';

type Props = {
  loading: boolean;
  labeledCount: number;
  totalCount: number;
  unlabeledCount: number;
  coverageSummary: LabelMapCoverageSummaryDto | null;
  emptyReason: LabelMapEmptyReason | null;
};

export function LabelCoverageHeader(props: Props) {
  const { t } = useTranslation();
  const { loading, labeledCount, totalCount, unlabeledCount, coverageSummary, emptyReason } = props;

  if (loading) {
    return <p className="muted labels-coverage-line">{t('labels.coverageLoading')}</p>;
  }

  if (totalCount === 0) {
    const key =
      emptyReason === 'no_extracted_documents'
        ? 'labels.coverageEmptyNoDocs'
        : emptyReason === 'embedding_unavailable'
          ? 'labels.coverageEmptyEmbeddings'
          : 'labels.coverageEmptyAwaiting';
    return <p className="muted labels-coverage-line">{t(key)}</p>;
  }

  const total = totalCount;
  const pct = total > 0 ? Math.round((labeledCount / total) * 100) : 0;

  return (
    <div className="labels-coverage-block">
      <div className="labels-coverage-line" role="status">
        <span className="labels-coverage-summary-text">
          {t('labels.coverageSummary', {
            labeled: labeledCount,
            total,
            count: total,
          })}
        </span>
        {unlabeledCount > 0 ? (
          <Link
            to={`${routes.documents}?filter=${encodeURIComponent('label:none')}`}
            className="labels-coverage-filter-link"
          >
            {t('labels.showUnlabeled', { count: unlabeledCount })}
          </Link>
        ) : null}
        <details className="labels-coverage-threshold-details">
          <summary className="labels-coverage-threshold-toggle">
            {t('labels.coverageHowMeasured')}
          </summary>
          <p className="muted labels-coverage-threshold-body">
            {t('labels.coverageThresholdExplain', {
              threshold: Math.round((coverageSummary?.threshold ?? 0.72) * 100),
            })}
          </p>
        </details>
      </div>
      <progress
        className="labels-coverage-progress"
        value={labeledCount}
        max={total}
        aria-label={t('labels.coverageProgressAria', { pct })}
      />
    </div>
  );
}
