// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DashboardStatisticsDto,
  DashboardWidgetDto,
  DashboardWidgetType,
  SavedDocumentViewDto,
} from '@docuvate/contracts';
import { CloudOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DashboardOnboarding } from '../components/dashboard/DashboardOnboarding';
import { DashboardStartSkeleton } from '../components/dashboard/DashboardStartSkeleton';
import { DashboardWidgets } from '../components/dashboard/DashboardWidgets';
import { StructuringHub } from '../components/pipeline';
import { useToastNotify } from '../components/save/ToastProvider';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Select';
import { DocumentUploadProvider } from '../components/upload';
import {
  getDashboardLayout,
  getDashboardStatistics,
  getDocumentReviewQueueSummary,
  listSavedDocumentViews,
  replaceDashboardLayout,
} from '../lib/api';
import { pipelineOverview } from '../lib/documentPipeline';
import { resolveLibraryDropTarget } from '../lib/documentUploadAssignment';

const DASHBOARD_DROP_TARGET = resolveLibraryDropTarget({ mode: 'all', filters: {}, folders: [] });

const ADDABLE_WIDGET_TYPES: DashboardWidgetType[] = [
  'upload',
  'statistics',
  'recent_documents',
  'attention',
  'saved_view',
];

function parseDashboardWidgetType(value: string): DashboardWidgetType {
  for (const type of ADDABLE_WIDGET_TYPES) {
    if (type === value) {
      return type;
    }
  }
  return 'statistics';
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { pushSuccess, pushError } = useToastNotify();
  const [widgets, setWidgets] = useState<DashboardWidgetDto[]>([]);
  const [savedViews, setSavedViews] = useState<SavedDocumentViewDto[]>([]);
  const [statistics, setStatistics] = useState<DashboardStatisticsDto | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addType, setAddType] = useState<DashboardWidgetType>('statistics');
  const [addViewId, setAddViewId] = useState('');
  const [reviewPendingCount, setReviewPendingCount] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  const addableWidgetTypes = useMemo(
    () =>
      ADDABLE_WIDGET_TYPES.filter(
        (type) => type === 'saved_view' || !widgets.some((w) => w.type === type)
      ),
    [widgets]
  );

  const refreshViews = useCallback(async () => {
    const items = await listSavedDocumentViews();
    setSavedViews(items);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [layout, stats] = await Promise.all([getDashboardLayout(), getDashboardStatistics()]);
      setWidgets(layout.widgets);
      setStatistics(stats);
      setLoadFailed(false);
      await refreshViews();
    } catch (err) {
      setLoadFailed(true);
      pushError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [pushError, refreshViews, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void getDocumentReviewQueueSummary()
      .then((summary) => {
        setReviewPendingCount(summary.pendingCount);
      })
      .catch(() => {
        setReviewPendingCount(0);
      });
  }, [widgets]);

  useEffect(() => {
    if (addableWidgetTypes.length === 0) {
      return;
    }
    if (!addableWidgetTypes.includes(addType)) {
      setAddType(addableWidgetTypes[0]);
    }
  }, [addType, addableWidgetTypes]);

  async function persist(next: DashboardWidgetDto[]) {
    setWidgets(next);
    try {
      const saved = await replaceDashboardLayout({
        widgets: next.map((w) => ({
          id: w.id.startsWith('new-') ? undefined : w.id,
          type: w.type,
          position: w.position,
          widthCols: w.widthCols,
          heightRows: w.heightRows,
          savedViewId: w.savedViewId,
          itemLimit: w.itemLimit,
        })),
      });
      setWidgets(saved.widgets);
      pushSuccess(t('common.saved'));
    } catch (err) {
      pushError(err instanceof Error ? err.message : t('errors.generic'));
      void load();
    }
  }

  function onAddWidget() {
    const position = widgets.length;
    const savedViewId = addType === 'saved_view' ? addViewId : null;
    const itemLimit =
      addType === 'saved_view'
        ? 5
        : addType === 'recent_documents' || addType === 'attention'
          ? 6
          : null;
    const next: DashboardWidgetDto[] = [
      ...widgets,
      {
        id: `new-${String(Date.now())}`,
        type: addType,
        position,
        widthCols: 6,
        heightRows: 2,
        savedViewId,
        itemLimit,
      },
    ];
    void persist(next);
  }

  const showOnboarding = statistics?.documentsTotal === 0 && !editMode;
  const overview = useMemo(
    () => (statistics ? pipelineOverview(statistics, reviewPendingCount) : null),
    [statistics, reviewPendingCount]
  );

  if (loading && !statistics) {
    return (
      <div className="page dashboard-page">
        <DashboardStartSkeleton />
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="page dashboard-page dv-page-grid">
        <DashboardOnboarding />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="page dashboard-page dv-page-grid">
        <header className="page-header dashboard-load-error-header">
          <h1 className="ds-page-header-title" data-ux="page-title">
            {t('dashboard.title')}
          </h1>
        </header>
        <EmptyState
          icon={CloudOff}
          className="dashboard-load-error"
          title={t('pipeline.hub.loadError')}
          description={t('errors.generic')}
          actions={
            <Button type="button" variant="primary" onClick={() => void load()}>
              {t('pipeline.hub.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  const customizeToggle = (
    <Button
      type="button"
      variant={editMode ? 'primary' : 'ghost'}
      className="dashboard-customize-toggle"
      onClick={() => {
        setEditMode((v) => !v);
      }}
    >
      {editMode ? t('dashboard.doneEditing') : t('dashboard.customize')}
    </Button>
  );

  return (
    <DocumentUploadProvider
      dropTarget={DASHBOARD_DROP_TARGET}
      onUploaded={() => {
        void load();
      }}
    >
      <div
        className="page dashboard-page dv-page-grid"
        data-load-state={loadFailed ? 'stale' : 'ok'}
      >
        <StructuringHub overview={overview} extraActions={customizeToggle} />

        {editMode ? (
          <div className="dashboard-add-panel card">
            <h2 className="dashboard-add-title">{t('dashboard.addWidget')}</h2>
            <div className="dashboard-add-row">
              <Select
                value={addType}
                onChange={(v) => {
                  setAddType(parseDashboardWidgetType(v));
                }}
                options={addableWidgetTypes.map((type) => ({
                  value: type,
                  label: t(`dashboard.widgetType.${type}`),
                }))}
                aria-label={t('dashboard.addWidget')}
              />
              {addType === 'saved_view' ? (
                <Select
                  value={addViewId}
                  onChange={setAddViewId}
                  options={[
                    { value: '', label: t('dashboard.pickSavedView') },
                    ...savedViews.map((v) => ({ value: v.id, label: v.name })),
                  ]}
                  aria-label={t('dashboard.pickSavedView')}
                />
              ) : null}
              <Button
                type="button"
                onClick={onAddWidget}
                disabled={addType === 'saved_view' && !addViewId}
              >
                {t('dashboard.addWidgetAction')}
              </Button>
            </div>
          </div>
        ) : null}

        <section className="dashboard-workspace" aria-labelledby="dashboard-workspace-title">
          <h2 id="dashboard-workspace-title" className="pipeline-section-title">
            {t('pipeline.hub.workspaceTitle')}
          </h2>
          <DashboardWidgets
            widgets={widgets}
            editMode={editMode}
            onWidgetsChange={(next) => {
              void persist(next);
            }}
            savedViews={savedViews}
            statistics={statistics}
          />
        </section>
      </div>
    </DocumentUploadProvider>
  );
}
