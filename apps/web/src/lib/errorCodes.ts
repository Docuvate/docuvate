// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type ErrorCode,errorCodeI18nKey, isErrorCode } from '@docuvate/contracts';

import { routes } from './routes';

export interface ErrorCodeDisplay {
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

function readOptionalEnvString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function errorCodeDocUrl(code: string): string {
  const configured = readOptionalEnvString(import.meta.env.VITE_ERROR_CODE_DOC_BASE_URL);
  const path = errorCodeDocPath(code);
  if (configured) {
    return `${configured.replace(/\/$/, '')}/${encodeURIComponent(code.trim())}`;
  }
  return path;
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

export function localizedMessageForErrorCode(code: string | undefined, t: (key: string) => string): string | undefined {
  const key = i18nKeyForErrorCode(code);
  if (!key) {
    return undefined;
  }
  const translated = t(key);
  if (translated === key) {
    return undefined;
  }
  return translated;
}

export function isClientGeneratedRequestId(requestId: string): boolean {
  return requestId.startsWith('client-');
}

export function newClientErrorRequestId(): string {
  const uuid = crypto.randomUUID().replace(/-/g, '');
  return `client-${uuid}`;
}

export type { ErrorCode };
