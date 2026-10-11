// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { getAdminAccess } from '../../lib/api';
import { routes } from '../../lib/routes';
import { Spinner } from '../ui/Spinner';

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    let cancelled = false;
    void getAdminAccess()
      .then((access) => {
        if (cancelled) return;
        setState(access.isAdministrator ? 'allowed' : 'denied');
      })
      .catch(() => {
        if (!cancelled) setState('denied');
      });
    return () => { cancelled = true; };
  }, []);

  if (state === 'loading') {
    return (
      <p className="muted settings-admin-guard-loading" role="status">
        <Spinner size="sm" label={t('common.loading')} />
        <span>{t('common.loading')}</span>
      </p>
    );
  }

  if (state === 'denied') {
    return (
      <Navigate
        to={routes.settings}
        replace
        state={{ adminDenied: true }}
      />
    );
  }

  return children;
}
