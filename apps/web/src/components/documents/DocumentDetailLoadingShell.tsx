// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { routes } from '../../lib/routes';
import { Skeleton } from '../ui/Skeleton';
import { DocumentDetailLoadStepList } from './DocumentDetailLoadStepList';

export function DocumentDetailLoadingShell() {
  const { t } = useTranslation();

  return (
    <div className="page document-detail-page document-detail-loading" aria-busy="true">
      <p className="document-detail-back">
        <Link to={routes.documents} className="document-detail-back-link">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          {t('documents.breadcrumbDocuments')}
        </Link>
      </p>

      <div className="doc-load-status card" role="status" aria-live="polite">
        <div className="doc-load-status-head">
          <h1 className="doc-load-status-title">{t('documents.loadingShellTitle')}</h1>
          <p className="muted doc-load-status-lead">{t('documents.loadingShellLead')}</p>
        </div>
        <DocumentDetailLoadStepList activeStep="metadata" />
        <div
          className="extraction-progress extraction-progress-indeterminate doc-load-status-progress"
          aria-hidden
        >
          <div className="extraction-progress-track">
            <div className="extraction-progress-fill" />
          </div>
        </div>
      </div>

      <div className="document-detail-tab-region doc-load-tabs-skeleton" aria-hidden>
        <div className="detail-tabs-bar">
          <Skeleton className="doc-load-tab-skeleton" />
          <Skeleton className="doc-load-tab-skeleton" />
          <Skeleton className="doc-load-tab-skeleton doc-load-tab-skeleton-short" />
        </div>
        <div className="detail-tab-panel-surface doc-load-tab-panel-skeleton">
          <Skeleton className="doc-load-line doc-load-line-title" />
          <Skeleton className="doc-load-line" />
          <Skeleton className="doc-load-line doc-load-line-medium" />
          <Skeleton className="doc-load-line doc-load-line-short" />
        </div>
      </div>

      <div className="detail-workspace doc-load-workspace" aria-hidden>
        <div className="card preview-card preview-card-pdf doc-load-preview-card">
          <Skeleton className="doc-load-line doc-load-pane-title" />
          <Skeleton className="doc-load-preview-frame" />
        </div>
        <div className="card extraction-panel-side doc-load-extraction-card">
          <Skeleton className="doc-load-line doc-load-pane-title" />
          <Skeleton className="doc-load-text-block" />
          <Skeleton className="doc-load-text-block doc-load-text-block-short" />
        </div>
      </div>
    </div>
  );
}
