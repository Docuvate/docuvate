// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { SavedDocumentViewDto } from '@docuvate/contracts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useToastNotify } from '../components/save/ToastProvider';
import { SavedViewsManageTable } from '../components/saved-views/SavedViewsManageTable';
import { Button } from '../components/ui/Button';
import {
  deleteSavedDocumentView,
  listSavedDocumentViews,
  reorderSavedDocumentViews,
  updateSavedDocumentView,
} from '../lib/api';
import { authClient, authSessionUserId } from '../lib/auth-client';
import { routes } from '../lib/routes';
import { notifySavedViewsChanged } from '../lib/savedViewsEvents';
import { useInstallationRole } from '../lib/useInstallationRole';

export function SavedViewsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pushSuccess, pushError } = useToastNotify();
  const role = useInstallationRole();
  const { data: sessionData } = authClient.useSession();
  const currentUserId = authSessionUserId(sessionData);
  const [views, setViews] = useState<SavedDocumentViewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listSavedDocumentViews();
      setViews(items);
    } catch (err) {
      pushError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [pushError, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveRename(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await updateSavedDocumentView(id, { name: trimmed });
      pushSuccess(t('common.saved'));
      notifySavedViewsChanged();
      await load();
    } catch (err) {
      pushError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  async function togglePin(view: SavedDocumentViewDto) {
    try {
      await updateSavedDocumentView(view.id, { pinnedSidebar: !view.pinnedSidebar });
      pushSuccess(t('common.saved'));
      notifySavedViewsChanged();
      await load();
    } catch (err) {
      pushError(err instanceof Error ? err.message : t('errors.generic'));
    }
  }

  async function reorder(orderedIds: string[]) {
    try {
      await reorderSavedDocumentViews({ orderedIds });
      pushSuccess(t('common.saved'));
      notifySavedViewsChanged();
      await load();
    } catch (err) {
      pushError(err instanceof Error ? err.message : t('errors.generic'));
    }
  }

  async function remove(view: SavedDocumentViewDto) {
    setBusy(true);
    try {
      await deleteSavedDocumentView(view.id);
      pushSuccess(t('common.saved'));
      notifySavedViewsChanged();
      await load();
    } catch (err) {
      pushError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  const canManageShared = role === 'admin';

  return (
    <div className="page saved-views-page" data-ux="page">
      <header className="page-header">
        <div>
          <h1 data-ux="page-title">{t('savedViews.manageTitle')}</h1>
          <p className="muted">{t('savedViews.manageLead')}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="saved-views-open-library-btn"
          onClick={() => { navigate(routes.documents); }}
        >
          {t('savedViews.openLibrary')}
        </Button>
      </header>

      {loading ? <p className="muted">{t('dashboard.loading')}</p> : null}

      {!loading && views.length > 0 ? (
        <SavedViewsManageTable
          views={views}
          currentUserId={currentUserId}
          canManageShared={canManageShared}
          busy={busy}
          onRename={saveRename}
          onTogglePin={togglePin}
          onDelete={remove}
          onReorder={reorder}
        />
      ) : null}
      {!loading && views.length === 0 ? (
        <p className="muted">{t('savedViews.manageEmpty')}</p>
      ) : null}
    </div>
  );
}
