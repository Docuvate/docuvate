// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ChevronDown, FileJson, FileOutput, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { exportDocumentFieldValues } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { downloadBlob, fieldValuesExportFilename } from '../../lib/downloadBlob';
import { useToastNotify } from '../save';
import { MenuItem } from '../ui/MenuItem';
import { Menu, MenuContent, MenuTrigger } from '../ui/overlay/Menu';

/** Export this document's field values at any time; structuring never has to be "finished". */
export function DocumentExportMenu({ documentId }: { documentId: string }) {
  const { t } = useTranslation();
  const { pushSuccess, pushError } = useToastNotify();
  const [busy, setBusy] = useState(false);

  async function onExport(format: 'csv' | 'json') {
    setBusy(true);
    try {
      const blob = await exportDocumentFieldValues(format, {}, [documentId]);
      downloadBlob(blob, fieldValuesExportFilename(format, new Date(), documentId.slice(0, 8)));
      pushSuccess(t('library.exportFieldValuesDone'));
    } catch (err) {
      pushError(formatUserFacingError(err, 'library.exportFieldValuesFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Menu>
      <MenuTrigger
        className="btn btn-secondary document-export-trigger"
        aria-label={t('pipeline.viewer.export.menu')}
        disabled={busy}
      >
        <FileOutput size={16} strokeWidth={2} aria-hidden />
        <span className="document-export-label">
          {busy ? t('pipeline.viewer.export.busy') : t('pipeline.viewer.export.menu')}
        </span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </MenuTrigger>
      <MenuContent className="popover-surface library-export-menu" align="end">
        <MenuItem
          role="menuitem"
          icon={FileSpreadsheet}
          label={t('pipeline.viewer.export.csv')}
          onClick={() => void onExport('csv')}
        />
        <MenuItem
          role="menuitem"
          icon={FileJson}
          label={t('pipeline.viewer.export.json')}
          onClick={() => void onExport('json')}
        />
      </MenuContent>
    </Menu>
  );
}
