// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

import { LabelPicker } from '../labels/LabelPicker';

interface LibraryTagFilterComboboxProps {
  activeTagIds: Set<string>;
  onToggleTag: (tagId: string) => void;
}

export function LibraryTagFilterCombobox({
  activeTagIds,
  onToggleTag,
}: LibraryTagFilterComboboxProps) {
  const { t } = useTranslation();

  return (
    <div className="library-tag-filter-combobox" data-testid="library-filter-tag-combobox">
      <span className="filter-label">{t('nav.labels')}</span>
      <LabelPicker
        selectionMode="toggle"
        onToggleTag={onToggleTag}
        activeTagIds={activeTagIds}
        placeholder={t('library.filter.labelSearchPlaceholder')}
        aria-label={t('nav.labels')}
      />
    </div>
  );
}
