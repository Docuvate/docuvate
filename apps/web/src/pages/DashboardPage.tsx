// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DashboardWidgetDto,
  DashboardWidgetType,
  SavedDocumentViewDto,
} from '@docuvate/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DashboardWidgets } from '../components/dashboard/DashboardWidgets';
import { useToastNotify } from '../components/save/ToastProvider';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { getDashboardLayout, listSavedDocumentViews, replaceDashboardLayout } from '../lib/api';

const ADDABLE_WIDGET_TYPES: DashboardWidgetType[] = [
  'upload',
  'statistics',
  'recent_documents',
  'attention',
  'saved_view',
];

export function DashboardPage() {
  const { t } = useTranslation();
  const { pushSuccess, pushError } = useToastNotify();
  const [widgets, setWidgets] = useState<DashboardWidgetDto[]>([]);
  const [savedViews, setSavedViews] = useState<SavedDocumentViewDto[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addType, setAddType] = useState<DashboardWidgetType>('statistics');
  const [addViewId, setAddViewId] = useState('');

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
      const layout = await getDashboardLayout();
      setWidgets(layout.widgets);
      await refreshViews();
    } catch (err) {
      pushError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [pushError, refreshViews, t]);

  useEffect(() => {
    void load();
  }, [load]);

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

  if (loading) {
    return (
      <div className="page dashboard-page">
        <p className="muted">{t('dashboard.loading')}</p>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <header className="page-header">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p className="muted">{t('dashboard.lead')}</p>
        </div>
        <div className="dashboard-header-actions">
          <Button
            type="button"
            variant={editMode ? 'primary' : 'secondary'}
            onClick={() => { setEditMode((v) => !v); }}
          >
            {editMode ? t('dashboard.doneEditing') : t('dashboard.customize')}
          </Button>
        </div>
      </header>

      {editMode ? (
        <div className="dashboard-add-panel card">
          <h2 className="dashboard-add-title">{t('dashboard.addWidget')}</h2>
          <div className="dashboard-add-row">
            <Select
              value={addType}
              onChange={(v) => { setAddType(v as DashboardWidgetType); }}
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

      <DashboardWidgets
        widgets={widgets}
        editMode={editMode}
        onWidgetsChange={(next) => void persist(next)}
        savedViews={savedViews}
        onRefreshViews={() => void refreshViews()}
      />
    </div>
  );
}
