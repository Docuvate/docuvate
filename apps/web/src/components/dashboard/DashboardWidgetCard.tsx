// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DashboardWidgetDto } from '@docuvate/contracts';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

interface DashboardWidgetCardProps {
  widget: DashboardWidgetDto;
  editMode: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  dragHandleProps?: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  title: string;
  children: ReactNode;
}

export function DashboardWidgetCard({
  widget,
  editMode,
  onMoveUp,
  onMoveDown,
  onRemove,
  dragHandleProps,
  title,
  children,
}: DashboardWidgetCardProps) {
  const { t } = useTranslation();
  const span = Math.min(12, Math.max(1, widget.widthCols));

  return (
    <section
      className={`dashboard-widget-card dashboard-widget-span-${span}`}
      style={{ gridRowEnd: `span ${widget.heightRows}` }}
      aria-label={title}
      {...(editMode && dragHandleProps
        ? {
            draggable: dragHandleProps.draggable,
            onDragStart: dragHandleProps.onDragStart,
            onDragOver: dragHandleProps.onDragOver,
            onDrop: dragHandleProps.onDrop,
          }
        : {})}
    >
      <header className="dashboard-widget-header">
        <h2 className="dashboard-widget-title">{title}</h2>
        {editMode ? (
          <div className="dashboard-widget-edit-actions">
            <Button
              type="button"
              variant="secondary"
              className="btn-compact"
              onClick={onMoveUp}
              aria-label={t('dashboard.moveUp')}
            >
              ↑
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-compact"
              onClick={onMoveDown}
              aria-label={t('dashboard.moveDown')}
            >
              ↓
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-compact"
              onClick={onRemove}
              aria-label={t('dashboard.removeWidget')}
            >
              ×
            </Button>
          </div>
        ) : null}
      </header>
      <div className="dashboard-widget-body">{children}</div>
    </section>
  );
}
