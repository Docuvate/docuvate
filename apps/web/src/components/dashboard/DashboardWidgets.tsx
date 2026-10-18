// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DashboardStatisticsDto,
  DashboardWidgetDto,
  DocumentDto,
  SavedDocumentViewDto,
} from '@docuvate/contracts';
import { FileText } from 'lucide-react';
import { type ReactNode,useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { getSavedDocumentView, listDocuments } from '../../lib/api';
import { resolveLibraryDropTarget } from '../../lib/documentUploadAssignment';
import { formatDocumentRelativeTime } from '../../lib/formatDocumentRelativeTime';
import { routes } from '../../lib/routes';
import { savedViewToListQuery } from '../../lib/savedViewState';
import { Badge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { Progress } from '../ui/Progress';
import { DocumentUploadProvider } from '../upload/DocumentUploadProvider';
import { UploadDropzone } from '../UploadDropzone';
import { DashboardWidgetCard } from './DashboardWidgetCard';

interface DashboardWidgetsProps {
  widgets: DashboardWidgetDto[];
  editMode: boolean;
  onWidgetsChange: (widgets: DashboardWidgetDto[]) => void;
  savedViews: SavedDocumentViewDto[];
  onRefreshViews: () => void;
  statistics: DashboardStatisticsDto | null;
}

function resolveWidgetTitle(
  widget: DashboardWidgetDto,
  savedViews: SavedDocumentViewDto[],
  t: (k: string) => string
): string {
  if (widget.type === 'saved_view') {
    const viewId = widget.savedViewId ?? '';
    const view = savedViews.find((v) => v.id === viewId);
    if (view?.name) return view.name;
  }
  return widgetTitle(widget.type, t);
}

function widgetTitle(type: DashboardWidgetDto['type'], t: (k: string) => string): string {
  switch (type) {
    case 'upload':
      return t('dashboard.widgetUpload');
    case 'statistics':
      return t('dashboard.widgetStatistics');
    case 'recent_documents':
      return t('dashboard.widgetRecent');
    case 'attention':
      return t('dashboard.widgetAttention');
    case 'saved_view':
      return t('dashboard.widgetSavedView');
    default: {
      const _never: never = type;
      return _never;
    }
  }
}

function widgetHeaderAside(
  widget: DashboardWidgetDto,
  attentionCount: number,
  t: (k: string) => string
): ReactNode | undefined {
  switch (widget.type) {
    case 'statistics':
      return (
        <Link to={routes.documents} className="dashboard-widget-link">
          {t('dashboard.allDocuments')}
        </Link>
      );
    case 'recent_documents':
    case 'saved_view':
      return (
        <Link to={routes.documents} className="dashboard-widget-link">
          {t('dashboard.viewAll')}
        </Link>
      );
    case 'attention':
      return attentionCount > 0 ? (
        <span className="dashboard-attention-open-count">
          {`${String(attentionCount)} ${t('dashboard.attentionOpenSuffix')}`}
        </span>
      ) : undefined;
    case 'upload': {
      return undefined;
    }
    default: {
      const _never: never = widget.type;
      return _never;
    }
  }
}

export function DashboardWidgets({
  widgets,
  editMode,
  onWidgetsChange,
  savedViews,
  onRefreshViews,
  statistics,
}: DashboardWidgetsProps) {
  const sorted = [...widgets].sort((a, b) => a.position - b.position);

  const moveWidget = useCallback(
    (index: number, direction: -1 | 1) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= sorted.length) return;
      const copy = [...sorted];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      onWidgetsChange(copy.map((w, position) => ({ ...w, position })));
    },
    [onWidgetsChange, sorted]
  );

  const removeWidget = useCallback(
    (id: string) => {
      onWidgetsChange(sorted.filter((w) => w.id !== id).map((w, position) => ({ ...w, position })));
    },
    [onWidgetsChange, sorted]
  );

  const onDragStart = (index: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (Number.isNaN(from) || from === targetIndex) return;
    const copy = [...sorted];
    const [item] = copy.splice(from, 1);
    copy.splice(targetIndex, 0, item);
    onWidgetsChange(copy.map((w, position) => ({ ...w, position })));
  };

  return (
    <DocumentUploadProvider
      dropTarget={resolveLibraryDropTarget({
        mode: 'all',
        filters: {},
        folders: [],
      })}
      onUploaded={() => {
        onRefreshViews();
      }}
    >
      <div className={`dashboard-grid${editMode ? ' dashboard-grid--edit' : ''}`}>
        {sorted.map((widget, index) => (
          <WidgetSlot
            key={widget.id}
            widget={widget}
            index={index}
            editMode={editMode}
            savedViews={savedViews}
            statistics={statistics}
            moveWidget={moveWidget}
            removeWidget={removeWidget}
            onDragStart={onDragStart}
            onDrop={onDrop}
          />
        ))}
      </div>
    </DocumentUploadProvider>
  );
}

function WidgetSlot({
  widget,
  index,
  editMode,
  savedViews,
  statistics,
  moveWidget,
  removeWidget,
  onDragStart,
  onDrop,
}: {
  widget: DashboardWidgetDto;
  index: number;
  editMode: boolean;
  savedViews: SavedDocumentViewDto[];
  statistics: DashboardStatisticsDto | null;
  moveWidget: (index: number, direction: -1 | 1) => void;
  removeWidget: (id: string) => void;
  onDragStart: (index: number) => (e: React.DragEvent) => void;
  onDrop: (targetIndex: number) => (e: React.DragEvent) => void;
}) {
  const { t, i18n } = useTranslation();
  const [docs, setDocs] = useState<DocumentDto[]>([]);

  useEffect(() => {
    if (widget.type === 'recent_documents' || widget.type === 'attention') {
      const limit = widget.itemLimit ?? 8;
      void listDocuments({
        sort: widget.type === 'recent_documents' ? 'createdAt' : 'updatedAt',
        order: 'desc',
      })
        .then((items) => {
          const filtered =
            widget.type === 'attention'
              ? items.filter((d) => d.status === 'failed' || d.status === 'extracting')
              : items;
          setDocs(filtered.slice(0, limit));
        })
        .catch(() => {
          setDocs([]);
        });
    }
  }, [widget]);

  useEffect(() => {
    if (widget.type !== 'saved_view') return;
    const viewId = widget.savedViewId ?? '';
    const known = savedViews.find((v) => v.id === viewId);
    const limit = widget.itemLimit ?? 5;
    const load = async () => {
      const view = known ?? (viewId ? await getSavedDocumentView(viewId) : null);
      if (!view) {
        setDocs([]);
        return;
      }
      const items = await listDocuments(savedViewToListQuery(view));
      setDocs(items.slice(0, limit));
    };
    void load().catch(() => {
      setDocs([]);
    });
  }, [widget, savedViews]);

  const attentionCount = widget.type === 'attention' ? docs.length : 0;

  return (
    <DashboardWidgetCard
      widget={widget}
      editMode={editMode}
      title={resolveWidgetTitle(widget, savedViews, t)}
      headerAside={widgetHeaderAside(widget, attentionCount, t)}
      onMoveUp={() => {
        moveWidget(index, -1);
      }}
      onMoveDown={() => {
        moveWidget(index, 1);
      }}
      onRemove={() => {
        removeWidget(widget.id);
      }}
      dragHandleProps={
        editMode
          ? {
              draggable: true,
              onDragStart: onDragStart(index),
              onDragOver: (e) => {
                e.preventDefault();
              },
              onDrop: onDrop(index),
            }
          : undefined
      }
    >
      <DashboardWidgetBody
        widget={widget}
        statistics={statistics}
        docs={docs}
        locale={i18n.language}
      />
    </DashboardWidgetCard>
  );
}

function DashboardWidgetBody({
  widget,
  statistics,
  docs,
  locale,
}: {
  widget: DashboardWidgetDto;
  statistics: DashboardStatisticsDto | null;
  docs: DocumentDto[];
  locale: string;
}) {
  const { t } = useTranslation();

  switch (widget.type) {
    case 'upload':
      return <UploadDropzone compact={false} />;
    case 'statistics':
      if (!statistics) return <p className="muted">{t('dashboard.loading')}</p>;
      return <DashboardStatisticsBody statistics={statistics} />;
    case 'recent_documents':
    case 'saved_view':
      if (docs.length === 0) {
        return <p className="muted">{t('dashboard.widgetEmpty')}</p>;
      }
      return (
        <ul className="dashboard-doc-list">
          {docs.map((doc) => (
            <DashboardDocumentRow key={doc.id} doc={doc} locale={locale} />
          ))}
        </ul>
      );
    case 'attention':
      if (docs.length === 0) {
        return <p className="muted">{t('dashboard.widgetAttentionEmpty')}</p>;
      }
      return (
        <ul className="dashboard-doc-list dashboard-doc-list-attention">
          {docs.map((doc) => (
            <DashboardDocumentRow key={doc.id} doc={doc} locale={locale} showOpenAction />
          ))}
        </ul>
      );
    default: {
      const _never: never = widget.type;
      return _never;
    }
  }
}

function DashboardStatisticsBody({ statistics }: { statistics: DashboardStatisticsDto }) {
  const { t } = useTranslation();
  const total = Math.max(statistics.documentsTotal, 1);

  const rows = [
    {
      label: t('dashboard.statTotal'),
      display: `${String(statistics.documentsTotal)}/${String(statistics.documentsTotal)}`,
      ratio: 1,
    },
    {
      label: t('dashboard.statReady'),
      display: String(statistics.byStatus.ready),
      ratio: statistics.byStatus.ready / total,
    },
    {
      label: t('dashboard.statLabeled'),
      display: String(statistics.labelsAssignedCount),
      ratio: statistics.labelsAssignedCount / total,
    },
    {
      label: t('dashboard.statUnlabeled'),
      display: String(statistics.unlabeledCount),
      ratio: statistics.unlabeledCount / total,
    },
  ];

  return (
    <>
      <ul className="dashboard-stat-rows">
        {rows.map((row) => (
          <li key={row.label} className="dashboard-stat-row">
            <div className="dashboard-stat-row-head">
              <span className="dashboard-stat-row-label">{row.label}</span>
              <span className="dashboard-stat-row-value">{row.display}</span>
            </div>
            <Progress
              value={row.ratio * 100}
              max={100}
              tone="accent"
              label={row.label}
              className="dashboard-stat-progress"
            />
          </li>
        ))}
      </ul>
      {statistics.topLabels.length > 0 ? (
        <div className="dashboard-top-labels">
          <p className="dashboard-top-labels-heading">{t('dashboard.statTopLabels')}</p>
          <ul className="dashboard-top-label-rows">
            {statistics.topLabels.slice(0, 5).map((row) => {
              const max = Math.max(...statistics.topLabels.map((item) => item.count), 1);
              return (
                <li key={row.name} className="dashboard-top-label-row">
                  <span className="dashboard-top-label-chip">
                    <Chip label={row.name} variant="assigned" truncateLabel />
                  </span>
                  <Progress
                    value={(row.count / max) * 100}
                    max={100}
                    tone="accent"
                    label={row.name}
                    className="dashboard-top-label-progress"
                  />
                  <span className="dashboard-top-label-count">{String(row.count)}</span>
                </li>
              );
            })}
          </ul>
          {statistics.labelsTotalCount > 5 ? (
            <Link to={routes.structureLabels} className="dashboard-widget-link dashboard-more-labels-link">
              {t('dashboard.moreLabelsLink', {
                count: statistics.labelsTotalCount - 5,
              })}
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function DashboardDocumentRow({
  doc,
  locale,
  showOpenAction = false,
}: {
  doc: DocumentDto;
  locale: string;
  showOpenAction?: boolean;
}) {
  const { t } = useTranslation();
  const title = doc.title || doc.filename;
  const timeIso = doc.createdAt || doc.updatedAt;

  if (showOpenAction) {
    return (
      <li className="dashboard-doc-row dashboard-doc-row-attention">
        <FileText size={16} className="dashboard-doc-row-icon" aria-hidden />
        <Link to={routes.document(doc.id)} className="dashboard-doc-row-title">
          {title}
        </Link>
        <span className="dashboard-doc-row-meta">
          {formatDocumentRelativeTime(timeIso, locale)}
        </span>
        <Link to={routes.document(doc.id)} className="btn btn-secondary btn-sm dashboard-doc-row-action">
          {t('dashboard.openDocument')}
        </Link>
      </li>
    );
  }

  return (
    <li className="dashboard-doc-row">
      <FileText size={16} className="dashboard-doc-row-icon" aria-hidden />
      <Link to={routes.document(doc.id)} className="dashboard-doc-row-title">
        {title}
      </Link>
      <Badge status={doc.status} />
      <span className="dashboard-doc-row-time">
        {formatDocumentRelativeTime(timeIso, locale)}
      </span>
    </li>
  );
}
