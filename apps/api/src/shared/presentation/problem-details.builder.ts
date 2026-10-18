// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  ERROR_CODES,
  type ErrorCode,
  errorCodeI18nKey,
  isErrorCode,
  PROBLEM_TYPE_ABOUT_BLANK,
  type ProblemDetails,
} from '@docuvate/contracts';
import { HttpStatus } from '@nestjs/common';

const STATUS_TITLES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
};

function defaultTitle(status: number): string {
  return STATUS_TITLES[status] ?? 'Error';
}

function looksLikeI18nKey(message: string): boolean {
  if (!message || message.includes(' ')) {
    return false;
  }
  return /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(message);
}

export function problemDetailForCode(code: ErrorCode, status: number, requestId: string): ProblemDetails {
  return {
    type: PROBLEM_TYPE_ABOUT_BLANK,
    title: defaultTitle(status),
    status,
    code,
    detail: errorCodeI18nKey(code),
    requestId,
  };
}

export function buildProblemDetails(input: {
  status: number;
  requestId: string;
  code: string;
  detail: string;
}): ProblemDetails {
  const code = isErrorCode(input.code) ? input.code : ERROR_CODES.INTERNAL_ERROR;
  let detail = errorCodeI18nKey(code);
  if (looksLikeI18nKey(input.detail)) {
    detail = input.detail;
  } else if (isErrorCode(input.detail)) {
    detail = errorCodeI18nKey(input.detail);
  } else if (isErrorCode(input.code)) {
    detail = errorCodeI18nKey(input.code);
  }

  return {
    type: PROBLEM_TYPE_ABOUT_BLANK,
    title: defaultTitle(input.status),
    status: input.status,
    code: isErrorCode(input.code) ? input.code : code,
    detail,
    requestId: input.requestId,
  };
}
