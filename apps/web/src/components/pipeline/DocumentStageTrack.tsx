// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  type DocumentStageState,
  PIPELINE_STAGES,
  pipelineStepStatus,
} from '../../lib/documentPipeline';
import { PIPELINE_STAGE_ICONS } from './pipelineIcons';

interface DocumentStageTrackProps {
  state: DocumentStageState;
  className?: string;
  /** Defaults to "progress of this document"; the review queue labels it as the pipeline. */
  ariaLabel?: string;
}

/** Four-step progress track for a single document (viewer header). */
export function DocumentStageTrack({ state, className = '', ariaLabel }: DocumentStageTrackProps) {
  const { t } = useTranslation();
  return (
    <ol
      className={`pipeline-track${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel ?? t('pipeline.viewer.trackAria')}
    >
      {PIPELINE_STAGES.map((stage) => {
        const status = pipelineStepStatus(stage, state);
        const Icon =
          status === 'done' ? Check : status === 'error' ? X : PIPELINE_STAGE_ICONS[stage];
        return (
          <li
            key={stage}
            className={`pipeline-track-step pipeline-track-step--${status}`}
            data-stage={stage}
            data-step-status={status}
            aria-current={status === 'current' || status === 'error' ? 'step' : undefined}
          >
            <span className="pipeline-track-marker" aria-hidden>
              <Icon size={14} strokeWidth={2.25} />
            </span>
            <span className="pipeline-track-label">{t(`pipeline.stage.${stage}`)}</span>
            <span className="sr-only">{t(`pipeline.stepStatus.${status}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}
