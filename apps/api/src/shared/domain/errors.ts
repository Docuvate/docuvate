// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  ERROR_CODES,
  type ErrorCode,
  errorCodeI18nKey,
  isErrorCode,
  notFoundCodeForResource,
} from '@docuvate/contracts';

export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly detailKey: string
  ) {
    super(detailKey);
    this.name = 'DomainError';
  }
}

function forbiddenCodeForDetail(detail: string): ErrorCode {
  if (detail.includes('document') || detail.includes('Document')) {
    return ERROR_CODES.DOC_ACCESS_FORBIDDEN;
  }
  if (detail.startsWith('admin.errors.')) {
    return ERROR_CODES.ADMIN_ACTION_FORBIDDEN;
  }
  if (detail.startsWith('Feature disabled:')) {
    return ERROR_CODES.FEATURE_DISABLED;
  }
  return ERROR_CODES.ACCESS_FORBIDDEN;
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    const code = notFoundCodeForResource(resource);
    super(code, errorCodeI18nKey(code));
  }
}

export class ForbiddenError extends DomainError {
  constructor(detail: string = errorCodeI18nKey(ERROR_CODES.ACCESS_FORBIDDEN)) {
    const code = forbiddenCodeForDetail(detail);
    const detailKey = looksLikeI18nKey(detail) ? detail : errorCodeI18nKey(code);
    super(code, detailKey);
  }
}

export class ValidationError extends DomainError {
  constructor(detail: string, code: ErrorCode = ERROR_CODES.VALIDATION_FAILED) {
    const detailKey = looksLikeI18nKey(detail) ? detail : detail.trim();
    super(code, detailKey);
  }
}

export class GatewayTimeoutError extends DomainError {
  constructor(detail: string = errorCodeI18nKey(ERROR_CODES.GATEWAY_TIMEOUT)) {
    super(ERROR_CODES.GATEWAY_TIMEOUT, looksLikeI18nKey(detail) ? detail : errorCodeI18nKey(ERROR_CODES.GATEWAY_TIMEOUT));
  }
}

export class ServiceUnavailableError extends DomainError {
  constructor(detail: string = errorCodeI18nKey(ERROR_CODES.SERVICE_UNAVAILABLE)) {
    super(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      looksLikeI18nKey(detail) ? detail : errorCodeI18nKey(ERROR_CODES.SERVICE_UNAVAILABLE)
    );
  }
}

export class ConflictError extends DomainError {
  constructor(
    detail: string = errorCodeI18nKey(ERROR_CODES.CONFLICT),
    code: ErrorCode = ERROR_CODES.CONFLICT
  ) {
    super(code, looksLikeI18nKey(detail) ? detail : errorCodeI18nKey(code));
  }
}

function looksLikeI18nKey(message: string): boolean {
  if (!message || message.includes(' ')) {
    return false;
  }
  return /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(message);
}

export function coerceLegacyErrorCode(code: string): ErrorCode {
  if (isErrorCode(code)) {
    return code;
  }
  switch (code) {
    case 'NOT_FOUND':
      return ERROR_CODES.RESOURCE_NOT_FOUND;
    case 'FORBIDDEN':
      return ERROR_CODES.ACCESS_FORBIDDEN;
    case 'VALIDATION_ERROR':
      return ERROR_CODES.VALIDATION_FAILED;
    case 'GATEWAY_TIMEOUT':
      return ERROR_CODES.GATEWAY_TIMEOUT;
    case 'SERVICE_UNAVAILABLE':
      return ERROR_CODES.SERVICE_UNAVAILABLE;
    case 'CONFLICT':
      return ERROR_CODES.CONFLICT;
    default:
      return ERROR_CODES.INTERNAL_ERROR;
  }
}
