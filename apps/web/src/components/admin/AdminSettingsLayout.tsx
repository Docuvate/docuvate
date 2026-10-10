// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type ReactNode,useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { getAdminAccess } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { routes } from '../../lib/routes';
import { SettingsSectionLayout } from '../settings/SettingsSectionLayout';

interface Props {
  sectionTitle: string;
  sectionLead?: string;
  sectionBreadcrumb?: ReactNode;
  children: ReactNode;
}

export function AdminSettingsLayout({
  sectionTitle,
  sectionLead,
  sectionBreadcrumb,
  children,
}: Props) {
  const [accessLoaded, setAccessLoaded] = useState(false);
  const [isAdministrator, setIsAdministrator] = useState(false);
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

  if (accessLoaded && !isAdministrator) {
    return <Navigate to={routes.settings} replace state={{ adminDenied: true }} />;
  }

  return (
    <SettingsSectionLayout
      sectionTitle={sectionTitle}
      sectionLead={sectionLead}
      sectionBreadcrumb={sectionBreadcrumb}
    >
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {children}
    </SettingsSectionLayout>
  );
}
