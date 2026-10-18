// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

export function AppBootLoading() {
  const { t } = useTranslation();
  return (
    <div className="app-boot-loading" role="status" aria-live="polite">
      <span className="app-boot-loading-spinner" aria-hidden />
      <p className="app-boot-loading-text">{t('shell.appLoading')}</p>
    </div>
  );
}
