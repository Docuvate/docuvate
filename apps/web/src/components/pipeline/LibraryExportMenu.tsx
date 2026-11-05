// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ChevronDown, FileJson, FileOutput, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MenuItem } from '../ui/MenuItem';
import { Menu, MenuContent, MenuTrigger } from '../ui/overlay/Menu';

interface LibraryExportMenuProps {
  busy: boolean;
  disabled: boolean;
  /** Selected rows; 0 exports every document matching the current filters. */
  selectedCount: number;
  onExport: (format: 'csv' | 'json') => void;
}

/** Export is the last pipeline step: one trigger that states its scope before you pick a format. */
export function LibraryExportMenu({
  busy,
  disabled,
  selectedCount,
  onExport,
}: LibraryExportMenuProps) {
  const { t } = useTranslation();
  const scope =
    selectedCount > 0
      ? t('pipeline.library.exportScopeSelected', { count: selectedCount })
      : t('pipeline.library.exportScopeFiltered');
  return (
    <Menu>
      <MenuTrigger
        className="btn btn-secondary library-export-trigger"
        aria-label={t('pipeline.library.exportMenuAria')}
        disabled={disabled || busy}
      >
        <FileOutput size={16} strokeWidth={2} aria-hidden />
        <span className="library-export-trigger-label">
          {busy ? t('library.exportFieldValuesPending') : t('pipeline.library.export')}
        </span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </MenuTrigger>
      <MenuContent className="popover-surface library-export-menu" align="end">
        <p className="library-export-scope">{scope}</p>
        <MenuItem
          role="menuitem"
          icon={FileSpreadsheet}
          label={t('pipeline.library.exportCsv')}
          onClick={() => {
            onExport('csv');
          }}
        />
        <MenuItem
          role="menuitem"
          icon={FileJson}
          label={t('pipeline.library.exportJson')}
          onClick={() => {
            onExport('json');
          }}
        />
      </MenuContent>
    </Menu>
  );
}
