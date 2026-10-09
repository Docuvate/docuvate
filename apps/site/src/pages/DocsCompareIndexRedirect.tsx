// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Navigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { comparisonsHubPath } from '../lib/compareData';

export function DocsCompareIndexRedirect() {
  const { locale, localizePath } = useLocale();
  return <Navigate to={localizePath(comparisonsHubPath(locale))} replace />;
}
