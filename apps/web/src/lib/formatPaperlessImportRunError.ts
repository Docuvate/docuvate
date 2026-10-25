// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PaperlessImportRunErrorDto } from '@docuvate/contracts';
import type { TFunction } from 'i18next';

const PAPERLESS_IMPORT_KEY_PREFIX = 'connectors.paperlessImport.';

export function isPaperlessImportMessageKey(key: string): boolean {
  return key.startsWith(PAPERLESS_IMPORT_KEY_PREFIX);
}

export function formatPaperlessImportRunError(
  t: TFunction,
  row: PaperlessImportRunErrorDto
): string {
  const params = row.messageParams.maxMb !== undefined
    ? { maxMb: row.messageParams.maxMb }
    : undefined;
  const translated = t(row.messageKey, {
    ...params,
    defaultValue: '',
  });
  if (translated.length > 0 && translated !== row.messageKey) {
    return translated;
  }
  return t('connectors.paperlessImport.documentFailed');
}
