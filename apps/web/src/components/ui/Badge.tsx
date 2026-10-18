// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentStatus } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

export function Badge({ status }: { status: DocumentStatus }) {
  const { t } = useTranslation();
  return <span className={`badge badge-${status}`}>{t(`library.status.${status}`)}</span>;
}
