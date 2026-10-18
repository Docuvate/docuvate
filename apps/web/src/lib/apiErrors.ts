// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { errorCodeI18nKey, isErrorCode } from '@docuvate/contracts';

import i18n from '../i18n';
import { i18nKeyForErrorCode } from './errorCodes';
import { markApiRequestFailed, markApiRequestSucceeded } from './serverReachability';

export interface UserFacingError {
  i18nKey: string;
  params?: Record<string, string | number>;
  retryable: boolean;
  code?: string;
  requestId?: string;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly requestId: string | undefined;
  readonly detailKey: string | undefined;

  constructor(
    status: number,
    code: string | undefined,
    detailKey: string,
    requestId: string | undefined
  ) {
    super(detailKey);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.detailKey = detailKey;
    this.requestId = requestId;
  }
}

const LEGACY_CODE_TO_I18N_KEY: Record<string, string> = {
  NOT_FOUND: 'errors.notFound',
  FORBIDDEN: 'errors.forbidden',
  VALIDATION_ERROR: 'errors.validation',
  CONFLICT: 'errors.conflict',
  GATEWAY_TIMEOUT: 'errors.timeout',
  SERVICE_UNAVAILABLE: 'errors.serverError',
  DOC_NOT_FOUND: 'errors.codes.DOC_NOT_FOUND',
  DOC_ACCESS_FORBIDDEN: 'errors.codes.DOC_ACCESS_FORBIDDEN',
  ACCESS_FORBIDDEN: 'errors.forbidden',
  VALIDATION_FAILED: 'errors.validation',
  RATE_LIMIT_EXCEEDED: 'errors.tooManyRequests',
  UPLOAD_TOO_LARGE: 'errors.payloadTooLarge',
  INTERNAL_ERROR: 'errors.serverError',
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function looksLikeI18nKey(message: string): boolean {
  if (!message || message.includes(' ')) {
    return false;
  }
  return /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(message);
}

function readStringField(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  return typeof value === 'string' ? value : undefined;
}

function parseProblemBody(body: Record<string, unknown>): {
  status?: number;
  code?: string;
  detail?: string;
  requestId?: string;
  message?: string;
} {
  const nested = isRecord(body.error) ? body.error : null;
  const status =
    (typeof body.status === 'number' ? body.status : undefined) ??
    (nested && typeof nested.status === 'number' ? nested.status : undefined);

  const code =
    readStringField(body, 'code') ??
    (nested ? readStringField(nested, 'code') : undefined);

  const detail =
    readStringField(body, 'detail') ??
    readStringField(body, 'message') ??
    (nested ? readStringField(nested, 'detail') ?? readStringField(nested, 'message') : undefined);

  const requestId =
    readStringField(body, 'requestId') ??
    (nested ? readStringField(nested, 'requestId') : undefined);

  return { status, code, detail, requestId, message: detail };
}

function parseUnknownError(err: unknown): {
  status?: number;
  code?: string;
  message?: string;
  requestId?: string;
} {
  if (err instanceof ApiRequestError) {
    return {
      status: err.status,
      code: err.code,
      message: err.detailKey,
      requestId: err.requestId,
    };
  }
  if (isRecord(err)) {
    const fromProblem = parseProblemBody(err);
    const nested = isRecord(err.error) ? err.error : null;
    const status =
      fromProblem.status ??
      (typeof err.status === 'number' ? err.status : undefined) ??
      (nested && typeof nested.status === 'number' ? nested.status : undefined);
    return {
      status,
      code: fromProblem.code,
      message: fromProblem.detail ?? fromProblem.message,
      requestId: fromProblem.requestId,
    };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return {};
}

function isLikelyNetworkError(err: unknown, status: number | undefined): boolean {
  if (status === 0) {
    return true;
  }
  if (err instanceof TypeError) {
    return true;
  }
  return false;
}

function isLikelyTimeout(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return true;
  }
  if (err instanceof Error && err.name === 'AbortError') {
    return true;
  }
  return false;
}

function statusI18nKey(status: number): string | undefined {
  if (status === 401) {
    return 'errors.pages.sessionExpired.lead';
  }
  if (status === 403) {
    return 'errors.forbidden';
  }
  if (status === 409) {
    return 'errors.conflict';
  }
  if (status === 413) {
    return 'errors.payloadTooLarge';
  }
  if (status === 429) {
    return 'errors.tooManyRequests';
  }
  if (status === 408 || status === 504) {
    return 'errors.timeout';
  }
  if (status >= 500) {
    return 'errors.serverError';
  }
  return undefined;
}

function logRawApiError(err: unknown, fallbackKey: string): void {
  const parsed = parseUnknownError(err);
  console.warn('[api]', {
    fallbackKey,
    code: parsed.code,
    status: parsed.status,
    requestId: parsed.requestId,
    message: parsed.message ?? (err instanceof Error ? err.message : String(err)),
    error: err,
  });
}

function resolveI18nKey(code: string | undefined, message: string, status: number | undefined, fallbackKey: string): string {
  if (message && looksLikeI18nKey(message)) {
    return message;
  }
  const codeKey = code ? i18nKeyForErrorCode(code) : undefined;
  if (codeKey) {
    return codeKey;
  }
  if (code && LEGACY_CODE_TO_I18N_KEY[code]) {
    return LEGACY_CODE_TO_I18N_KEY[code];
  }
  if (code && isErrorCode(code)) {
    return errorCodeI18nKey(code);
  }
  if (typeof status === 'number') {
    const byStatus = statusI18nKey(status);
    if (byStatus) {
      return byStatus;
    }
  }
  return fallbackKey;
}

export function toUserFacingError(err: unknown, fallbackKey = 'errors.generic'): UserFacingError {
  logRawApiError(err, fallbackKey);

  const parsed = parseUnknownError(err);
  const status = parsed.status;
  const code = parsed.code;
  const message = parsed.message ?? '';

  if (isLikelyNetworkError(err, status)) {
    return {
      i18nKey: 'errors.networkError',
      retryable: true,
      code: code ?? 'SERVICE_UNAVAILABLE',
      requestId: parsed.requestId,
    };
  }
  if (isLikelyTimeout(err)) {
    return {
      i18nKey: 'errors.timeout',
      retryable: true,
      code: code ?? 'GATEWAY_TIMEOUT',
      requestId: parsed.requestId,
    };
  }

  const i18nKey = resolveI18nKey(code, message, status, fallbackKey);
  const retryable =
    status === 429 ||
    (typeof status === 'number' && status >= 500) ||
    code === 'GATEWAY_TIMEOUT' ||
    code === 'SERVICE_UNAVAILABLE' ||
    i18nKey === 'errors.serverError' ||
    i18nKey === 'errors.tooManyRequests';

  return {
    i18nKey,
    retryable,
    code,
    requestId: parsed.requestId,
  };
}

export function formatUserFacingError(err: unknown, fallbackKey: string): string {
  const facing = toUserFacingError(err, fallbackKey);
  return i18n.t(facing.i18nKey, facing.params ?? {});
}

export function apiErrorToastPayload(
  err: unknown,
  fallbackKey: string
): { message: string; code?: string; requestId?: string; retry?: () => void } {
  const facing = toUserFacingError(err, fallbackKey);
  return {
    message: i18n.t(facing.i18nKey, facing.params ?? {}),
    code: facing.code,
    requestId: facing.requestId,
  };
}

export function throwApiRequestError(
  status: number,
  body: Record<string, unknown>,
  headerRequestId?: string | null
): never {
  const parsed = parseProblemBody(body);
  const code = parsed.code;
  const detail =
    parsed.detail ??
    readStringField(body, 'message') ??
    `errors.generic`;
  const requestId = parsed.requestId ?? headerRequestId ?? undefined;
  markApiRequestFailed(new ApiRequestError(status, code, detail, requestId));
  throw new ApiRequestError(status, code, detail, requestId);
}

export function notifyApiRequestSucceeded(): void {
  markApiRequestSucceeded();
}

const CHAT_GENERATION_ERROR_KEYS: Record<string, string> = {
  generation_timeout: 'documents.documentChat.errorTimeout',
  cancelled: 'documents.documentChat.errorCancelled',
  ollama_error: 'documents.documentChat.errorOllama',
  worker_unreachable: 'documents.documentChat.errorWorkerUnreachable',
  provider_unavailable: 'documents.documentChat.errorProviderUnavailable',
  unknown: 'documents.documentChat.errorGeneric',
};

export function toUserFacingChatGenerationError(
  errorCode: string | null | undefined,
  options?: { log?: boolean }
): UserFacingError {
  const normalized = errorCode?.trim() ?? 'unknown';
  const i18nKey = CHAT_GENERATION_ERROR_KEYS[normalized] ?? CHAT_GENERATION_ERROR_KEYS.unknown;
  if (options?.log && normalized !== 'unknown') {
    console.warn('[api]', 'chatGeneration', { errorCode: normalized, i18nKey });
  }
  return {
    i18nKey,
    retryable: normalized !== 'cancelled',
  };
}

export function formatChatGenerationError(errorCode: string | null | undefined): string {
  const facing = toUserFacingChatGenerationError(errorCode, { log: true });
  return i18n.t(facing.i18nKey, facing.params ?? {});
}
