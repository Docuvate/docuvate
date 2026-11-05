// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ArrowRight, Plug } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { type PipelineOverview, pipelineTasks } from '../../lib/documentPipeline';
import { routes } from '../../lib/routes';
import { UploadFeedbackBanner, UploadFileTrigger, UploadQueueList } from '../upload';
import { PipelineRail } from './PipelineRail';
import { PipelineTaskList } from './PipelineTaskList';

interface StructuringHubProps {
  overview: PipelineOverview;
  /** Customize toggle etc. (rendered in the hero's action row). */
  extraActions?: ReactNode;
}

/**
 * Dashboard hero: the structuring mission (upload → structure → review → export) with upload as
 * the primary action, the live pipeline and the prioritized next steps. Must be rendered inside a
 * DocumentUploadProvider.
 */
export function StructuringHub({ overview, extraActions }: StructuringHubProps) {
  const { t } = useTranslation();
  const tasks = pipelineTasks(overview);
  const progress = overview.total > 0 ? Math.round((overview.ready / overview.total) * 100) : 0;

  return (
    <div className="structuring-hub">
      <section className="page-header structuring-hero" aria-labelledby="structuring-hero-title">
        <div className="structuring-hero-copy">
          <p className="structuring-hero-eyebrow">{t('pipeline.hub.eyebrow')}</p>
          <h1 id="structuring-hero-title" className="structuring-hero-title" data-ux="page-title">
            {t('pipeline.hub.title')}
          </h1>
          <p className="structuring-hero-lead">{t('pipeline.hub.lead')}</p>
          <div className="structuring-hero-actions">
            <UploadFileTrigger variant="primary" />
            <Link to={routes.settingsConnectors} className="btn btn-secondary">
              <Plug size={16} strokeWidth={2} aria-hidden />
              {t('pipeline.hub.importSources')}
            </Link>
            {overview.review > 0 ? (
              <Link to={routes.reviewQueue} className="btn btn-ghost structuring-hero-review">
                {t('pipeline.hub.openReview')}
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
            ) : null}
            {extraActions}
          </div>
          <UploadQueueList />
          <UploadFeedbackBanner />
        </div>
        <div className="structuring-hero-progress">
          <p className="structuring-hero-progress-label">{t('pipeline.hub.progressTitle')}</p>
          <p className="structuring-hero-progress-value">
            <span className="structuring-hero-progress-number">{progress}</span>
            <span className="structuring-hero-progress-unit">%</span>
          </p>
          <div
            className="structuring-hero-meter"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={t('pipeline.hub.progressLead', {
              ready: overview.ready,
              total: overview.total,
            })}
          >
            <span
              className="structuring-hero-meter-fill"
              style={{ inlineSize: `${String(progress)}%` }}
            />
          </div>
          <p className="muted structuring-hero-progress-lead">
            {t('pipeline.hub.progressLead', { ready: overview.ready, total: overview.total })}
          </p>
        </div>
      </section>

      <PipelineRail overview={overview} />
      <PipelineTaskList tasks={tasks} />
    </div>
  );
}
