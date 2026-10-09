import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DashboardWidgetDto, DocumentDto, SavedDocumentViewDto } from '@docuvate/contracts';
import { UploadDropzone } from '../UploadDropzone';
import { DocumentUploadProvider } from '../upload/DocumentUploadProvider';
import { getDashboardStatistics, getSavedDocumentView, listDocuments } from '../../lib/api';
import { routes } from '../../lib/routes';
import { resolveLibraryDropTarget } from '../../lib/documentUploadAssignment';
import { savedViewToListQuery } from '../../lib/savedViewState';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { Badge } from '../ui/Badge';

interface DashboardWidgetsProps {
  widgets: DashboardWidgetDto[];
  editMode: boolean;
  onWidgetsChange: (widgets: DashboardWidgetDto[]) => void;
  savedViews: SavedDocumentViewDto[];
  onRefreshViews: () => void;
}

function resolveWidgetTitle(
  widget: DashboardWidgetDto,
  savedViews: SavedDocumentViewDto[],
  t: (k: string) => string
): string {
  if (widget.type === 'saved_view') {
    const viewId = String(widget.savedViewId ?? '');
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

export function DashboardWidgets({
  widgets,
  editMode,
  onWidgetsChange,
  savedViews,
  onRefreshViews,
}: DashboardWidgetsProps) {
  const { t } = useTranslation();
  const sorted = [...widgets].sort((a, b) => a.position - b.position);

  const moveWidget = useCallback(
    (index: number, direction: -1 | 1) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= sorted.length) return;
      const copy = [...sorted];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item!);
      onWidgetsChange(copy.map((w, position) => ({ ...w, position })));
    },
    [onWidgetsChange, sorted]
  );

  const removeWidget = useCallback(
    (id: string) => {
      onWidgetsChange(
        sorted.filter((w) => w.id !== id).map((w, position) => ({ ...w, position }))
      );
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
    copy.splice(targetIndex, 0, item!);
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
          <DashboardWidgetCard
            key={widget.id}
            widget={widget}
            editMode={editMode}
            title={resolveWidgetTitle(widget, savedViews, t)}
            onMoveUp={() => moveWidget(index, -1)}
            onMoveDown={() => moveWidget(index, 1)}
            onRemove={() => removeWidget(widget.id)}
            dragHandleProps={
              editMode
                ? {
                    draggable: true,
                    onDragStart: onDragStart(index),
                    onDragOver: (e) => e.preventDefault(),
                    onDrop: onDrop(index),
                  }
                : undefined
            }
          >
            <DashboardWidgetBody widget={widget} savedViews={savedViews} />
          </DashboardWidgetCard>
        ))}
      </div>
    </DocumentUploadProvider>
  );
}

function DashboardWidgetBody({
  widget,
  savedViews,
}: {
  widget: DashboardWidgetDto;
  savedViews: SavedDocumentViewDto[];
}) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStatistics>> | null>(null);
  const [docs, setDocs] = useState<DocumentDto[]>([]);

  useEffect(() => {
    if (widget.type === 'statistics') {
      void getDashboardStatistics().then(setStats).catch(() => setStats(null));
    }
  }, [widget.type]);

  useEffect(() => {
    if (widget.type === 'recent_documents' || widget.type === 'attention') {
      const limit = Number(widget.itemLimit ?? 8);
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
        .catch(() => setDocs([]));
    }
  }, [widget]);

  useEffect(() => {
    if (widget.type !== 'saved_view') return;
    const viewId = String(widget.savedViewId ?? '');
    const known = savedViews.find((v) => v.id === viewId);
    const limit = Number(widget.itemLimit ?? 5);
    const load = async () => {
      const view = known ?? (viewId ? await getSavedDocumentView(viewId) : null);
      if (!view) {
        setDocs([]);
        return;
      }
      const items = await listDocuments(savedViewToListQuery(view));
      setDocs(items.slice(0, limit));
    };
    void load().catch(() => setDocs([]));
  }, [widget, savedViews]);

  switch (widget.type) {
    case 'upload':
      return <UploadDropzone compact={false} />;
    case 'statistics':
      if (!stats) return <p className="muted">{t('dashboard.loading')}</p>;
      return (
        <>
          <dl className="dashboard-stats">
            <div>
              <dt>{t('dashboard.statTotal')}</dt>
              <dd>{stats.documentsTotal}</dd>
            </div>
            <div>
              <dt>{t('dashboard.statReady')}</dt>
              <dd>{stats.byStatus.ready ?? 0}</dd>
            </div>
            <div>
              <dt>{t('dashboard.statUnlabeled')}</dt>
              <dd>{stats.unlabeledCount}</dd>
            </div>
            <div>
              <dt>{t('dashboard.statLabeled')}</dt>
              <dd>{stats.labelsAssignedCount}</dd>
            </div>
          </dl>
          {stats.topLabels.length > 0 ? (
            <ul className="dashboard-label-distribution" aria-label={t('dashboard.statLabelDistribution')}>
              {stats.topLabels.map((row) => (
                <li key={row.name}>
                  <span>{row.name}</span>
                  <span className="muted">{row.count}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      );
    case 'recent_documents':
    case 'attention':
    case 'saved_view':
      if (docs.length === 0) {
        return <p className="muted">{t('dashboard.widgetEmpty')}</p>;
      }
      return (
        <ul className="dashboard-doc-list">
          {docs.map((doc) => (
            <li key={doc.id}>
              <Link to={routes.document(doc.id)} className="dashboard-doc-link">
                <span className="dashboard-doc-title">{doc.title || doc.filename}</span>
                <Badge status={doc.status} />
              </Link>
            </li>
          ))}
        </ul>
      );
    default: {
      const _never: never = widget.type;
      return _never;
    }
  }
}
