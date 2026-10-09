// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getAdminAccess } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { routes } from '../../lib/routes';
import { useToast } from '../save/ToastProvider';
import { SettingsTabBar } from './SettingsTabBar';

export function SettingsAreaLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [isAdministrator, setIsAdministrator] = useState(false);
  const [accessLoaded, setAccessLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAdminAccess()
      .then((access) => {
        setIsAdministrator(access.isAdministrator);
        setAccessLoaded(true);
      })
      .catch((err: unknown) => {
        setError(formatUserFacingError(err, 'errors.loadFailed'));
        setAccessLoaded(true);
      });
  }, []);

  useEffect(() => {
    const state = location.state as { adminDenied?: boolean } | null;
    if (state?.adminDenied) {
      toast.error(t('admin.accessDeniedToast'));
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, toast, t]);

  const adminRoute = location.pathname.startsWith(routes.settingsAdmin);
  if (accessLoaded && adminRoute && !isAdministrator) {
    return <Navigate to={routes.settings} replace state={{ adminDenied: true }} />;
  }

  return (
    <div className="page settings-area-page">
      <header className="page-header settings-area-header">
        <div>
          <h1>{t('settings.title')}</h1>
          <p className="muted">{t('settings.lead')}</p>
        </div>
      </header>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <SettingsTabBar />

      <div className="settings-area-content">
        <Outlet context={{ isAdministrator }} />
      </div>
    </div>
  );
}
