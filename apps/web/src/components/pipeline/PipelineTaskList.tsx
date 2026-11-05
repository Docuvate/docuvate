// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  AlertTriangle,
  ArrowRight,
  CircleCheck,
  Hourglass,
  ListChecks,
  type LucideIcon,
  ScanText,
  Tags,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { PipelineTask, PipelineTaskKind } from '../../lib/documentPipeline';

const TASK_ICONS: Record<PipelineTaskKind, LucideIcon> = {
  review: ListChecks,
  failed: AlertTriangle,
  unlabeled: Tags,
  structuring: ScanText,
  waiting: Hourglass,
};

interface PipelineTaskListProps {
  tasks: PipelineTask[];
}

/** "Next steps": one actionable row per kind of open work, most urgent first. */
export function PipelineTaskList({ tasks }: PipelineTaskListProps) {
  const { t } = useTranslation();
  return (
    <section className="pipeline-tasks" aria-labelledby="pipeline-tasks-title">
      <header className="pipeline-tasks-header">
        <h2 id="pipeline-tasks-title" className="pipeline-section-title">
          {t('pipeline.tasks.title')}
        </h2>
        <p className="muted pipeline-tasks-lead">{t('pipeline.tasks.lead')}</p>
      </header>
      {tasks.length === 0 ? (
        <p className="pipeline-tasks-empty">
          <CircleCheck size={18} strokeWidth={2} aria-hidden />
          {t('pipeline.tasks.empty')}
        </p>
      ) : (
        <ul className="pipeline-task-list">
          {tasks.map((task, index) => {
            const Icon = TASK_ICONS[task.kind];
            const primary = index === 0 && (task.kind === 'review' || task.kind === 'failed');
            return (
              <li
                key={task.kind}
                className={`pipeline-task pipeline-task--${task.kind}`}
                data-task={task.kind}
              >
                <span className="pipeline-task-icon" aria-hidden>
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className="pipeline-task-body">
                  <span id={`pipeline-task-${task.kind}-title`} className="pipeline-task-title">
                    {t(`pipeline.tasks.${task.kind}.title`, { count: task.count })}
                  </span>
                  <span className="pipeline-task-text">
                    {t(`pipeline.tasks.${task.kind}.text`)}
                  </span>
                </span>
                <Link
                  to={task.href}
                  aria-describedby={`pipeline-task-${task.kind}-title`}
                  className={`btn ${primary ? 'btn-primary' : 'btn-secondary'} pipeline-task-action`}
                >
                  {t(`pipeline.tasks.${task.kind}.action`)}
                  <ArrowRight size={16} strokeWidth={2} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
