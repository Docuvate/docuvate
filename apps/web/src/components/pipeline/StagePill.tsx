// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentStatus } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import type { DocumentStageState } from '../../lib/documentPipeline';

interface StagePillProps {
  state: DocumentStageState;
  /** Processing status; keeps the `badge badge-<status>` hooks other screens and tests rely on. */
  status?: DocumentStatus;
  className?: string;
}

/** Where a document is in the structuring pipeline (Wartet · Wird strukturiert · Zu prüfen · …). */
export function StagePill({ state, status, className = '' }: StagePillProps) {
  const { t } = useTranslation();
  const statusHooks = status ? `badge badge-${status} ` : '';
  return (
    <span
      className={`${statusHooks}pipeline-pill pipeline-pill--${state}${className ? ` ${className}` : ''}`}
      data-stage-state={state}
    >
      <span className="pipeline-pill-dot" aria-hidden />
      {t(`pipeline.state.${state}`)}
    </span>
  );
}
