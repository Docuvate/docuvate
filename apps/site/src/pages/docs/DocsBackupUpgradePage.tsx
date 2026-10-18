// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { getDocsExtended } from '../../content/docsExtended';
import { useLocale } from '../../context/LocaleContext';
import { DocsGuidePageView } from '../DocsGuidePage';

export function DocsBackupUpgradePage() {
  const { locale } = useLocale();
  return <DocsGuidePageView page={getDocsExtended(locale).backupUpgrade} />;
}
