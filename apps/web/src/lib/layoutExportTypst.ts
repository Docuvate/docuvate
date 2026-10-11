// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TFunction } from 'i18next';

export function typstExportDegradedMessage(
  t: TFunction,
  unreliableReason?: string | null
): string {
  if (unreliableReason === 'unsupported_script') {
    return t('documents.layoutExportTypstDegradedUnsupportedScript');
  }
  if (unreliableReason === 'scan_without_text_layer') {
    return t('documents.layoutExportTypstDegradedScanWithoutTextLayer');
  }
  if (unreliableReason === 'extraction_failed') {
    return t('documents.layoutExportTypstDegradedExtractionFailed');
  }
  return t('documents.layoutExportTypstDegradedDefault');
}
