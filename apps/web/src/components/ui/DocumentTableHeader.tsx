// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

import { Checkbox } from './Checkbox';

export interface DocumentTableHeaderProps {
  onToggleAll?: () => void;
  allSelected?: boolean;
  indeterminate?: boolean;
}

export function DocumentTableHeader({
  onToggleAll,
  allSelected,
  indeterminate,
}: DocumentTableHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="doc-table-header">
      <Checkbox
        checked={allSelected}
        indeterminate={indeterminate}
        aria-label={t('ui.table.selectAll')}
        onChange={() => onToggleAll?.()}
      />
      <span aria-hidden />
      <span>{t('ui.table.title')}</span>
      <span>{t('ui.table.correspondent')}</span>
      <span>{t('ui.table.labels')}</span>
      <span>{t('ui.table.date')}</span>
      <span>{t('ui.table.status')}</span>
    </div>
  );
}
