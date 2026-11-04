// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import i18n from '../i18n';
import { formatUserFacingError, looksLikeI18nKey } from './apiErrors';

export function layoutCompareUserMessage(err: unknown): string {
  const formatted = formatUserFacingError(err, 'documents.layoutCompareErrors.compareFailed');
  if (looksLikeI18nKey(formatted)) {
    return i18n.t(formatted);
  }
  return formatted;
}
