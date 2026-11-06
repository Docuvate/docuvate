// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  PIPELINE_HREFS,
  type PipelineOverview,
  type PipelineStage,
} from '../../lib/documentPipeline';
import { PIPELINE_STAGE_ICONS } from './pipelineIcons';

interface PipelineRailProps {
  overview: PipelineOverview;
  className?: string;
}

interface RailStep {
  stage: PipelineStage;
  count: number;
  caption: string;
  href: string;
  /** Work that needs the user (review) is emphasized; automatic work is calm. */
  emphasis: boolean;
}

/**
 * Workspace-wide pipeline: how many documents sit in each stage, each linking to the filtered
 * library (or the review queue). Failures surface as a separate danger link on "Structure".
 */
export function PipelineRail({ overview, className = '' }: PipelineRailProps) {
  const { t } = useTranslation();
  const steps: RailStep[] = [
    {
      stage: 'upload',
      count: overview.waiting,
      caption:
        overview.waiting > 0
          ? t('pipeline.rail.waiting', { count: overview.waiting })
          : t('pipeline.rail.waitingNone'),
      href: PIPELINE_HREFS.queued,
      emphasis: false,
    },
    {
      stage: 'structure',
      count: overview.structuring,
      caption:
        overview.structuring > 0
          ? t('pipeline.rail.structuring', { count: overview.structuring })
          : t('pipeline.rail.structuringNone'),
      href: PIPELINE_HREFS.structuring,
      emphasis: false,
    },
    {
      stage: 'review',
      count: overview.review,
      caption:
        overview.review > 0
          ? t('pipeline.rail.review', { count: overview.review })
          : t('pipeline.rail.reviewNone'),
      href: PIPELINE_HREFS.review,
      emphasis: overview.review > 0,
    },
    {
      stage: 'record',
      count: overview.ready,
      caption:
        overview.ready > 0
          ? t('pipeline.rail.ready', { count: overview.ready })
          : t('pipeline.rail.readyNone'),
      href: PIPELINE_HREFS.ready,
      emphasis: false,
    },
  ];

  return (
    <nav
      className={`pipeline-rail${className ? ` ${className}` : ''}`}
      aria-label={t('pipeline.railAria')}
    >
      <ol className="pipeline-rail-list">
        {steps.map((step, index) => {
          const Icon = PIPELINE_STAGE_ICONS[step.stage];
          return (
            <li
              key={step.stage}
              className={`pipeline-rail-step${step.emphasis ? ' pipeline-rail-step--emphasis' : ''}`}
              data-stage={step.stage}
            >
              <Link to={step.href} className="pipeline-rail-link">
                <span className="pipeline-rail-head">
                  <span className="pipeline-rail-icon" aria-hidden>
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <span className="pipeline-rail-index" aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </span>
                <span className="pipeline-rail-count">{step.count}</span>
                <span className="pipeline-rail-stage">{t(`pipeline.stage.${step.stage}`)}</span>
                <span className="pipeline-rail-caption">{step.caption}</span>
              </Link>
              {step.stage === 'structure' && overview.failed > 0 ? (
                <Link to={PIPELINE_HREFS.failed} className="pipeline-rail-alert">
                  <AlertTriangle size={14} strokeWidth={2} aria-hidden />
                  {t('pipeline.rail.failed', { count: overview.failed })}
                </Link>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
