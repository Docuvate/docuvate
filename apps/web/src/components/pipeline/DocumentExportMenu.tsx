// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { exportDocumentFieldValues } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { downloadBlob, fieldValuesExportFilename } from '../../lib/downloadBlob';
import { useToastNotify } from '../save';

type FieldExportFormat = 'csv' | 'json';

/**
 * Export one document's field values. The record itself is the product; this is a tertiary
 * hand-off, so it lives in the document's overflow menu rather than in the header.
 */
export function useDocumentFieldExport(documentId: string) {
  const { t } = useTranslation();
  const { pushSuccess, pushError } = useToastNotify();
  const [busy, setBusy] = useState(false);

  async function exportAs(format: FieldExportFormat) {
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

  return { busy, exportAs };
}
