// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';
import { authClient } from '../lib/auth-client';
import { AppShell } from '../components/AppShell';
import { LocaleSwitcher } from '../components/layout/LocaleSwitcher';
import { NotFoundPage } from './NotFoundPage';

export function NotFoundRoute() {
  const { t } = useTranslation();
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="auth-layout">
        <p className="muted auth-card-loading">{t('notFoundPage.loading')}</p>
      </div>
    );
  }

  if (data?.session) {
    return (
      <AppShell>
        <NotFoundPage />
      </AppShell>
    );
  }

  return (
    <div className="auth-layout">
      <div className="auth-locale">
        <LocaleSwitcher />
      </div>
      <NotFoundPage />
    </div>
  );
}
