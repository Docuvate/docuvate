// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TFunction } from 'i18next';

export function typstExportDegradedMessage(
  t: TFunction,
  unreliableReason?: string | null
): string {
  switch (unreliableReason) {
    case 'unsupported_script':
      return t('documents.layoutExportTypstDegradedUnsupportedScript');
    case 'scan_without_text_layer':
      return t('documents.layoutExportTypstDegradedScanWithoutTextLayer');
    case 'extraction_failed':
      return t('documents.layoutExportTypstDegradedExtractionFailed');
    default:
      return t('documents.layoutExportTypstDegradedDefault');
  }
}
