// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { errorCodeI18nKey, isErrorCode } from '@docuvate/contracts';

import { routes } from './routes';

interface ErrorCodeDisplay {
  code: string;
  requestId: string;
}

export function formatErrorIdForDisplay(requestId: string): string {
  const compact = requestId.replace(/-/g, '').toLowerCase();
  const slice = compact.slice(0, 8);
  if (slice.length <= 4) {
    return slice;
  }
  return `${slice.slice(0, 4)}-${slice.slice(4, 8)}`;
}

export function errorCodeDocPath(code: string): string {
  const normalized = code.trim();
  if (!normalized) {
    return routes.errorCodesIndex;
  }
  return routes.errorCodeDoc(normalized);
}

export function copyErrorDiagnosticsText(
  display: ErrorCodeDisplay,
  labels: { errorCode: string; errorId: string }
): string {
  return `${labels.errorCode} ${display.code} · ${labels.errorId} ${formatErrorIdForDisplay(display.requestId)}`;
}

export function i18nKeyForErrorCode(code: string | undefined): string | undefined {
  if (!code) {
    return undefined;
  }
  if (isErrorCode(code)) {
    return errorCodeI18nKey(code);
  }
  return undefined;
}

export function newClientErrorRequestId(): string {
  const uuid = crypto.randomUUID().replace(/-/g, '');
  return `client-${uuid}`;
}
