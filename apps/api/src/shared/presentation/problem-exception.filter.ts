// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  ERROR_CODES,
  type ErrorCode,
  PROBLEM_DETAILS_MEDIA_TYPE,
  PROBLEM_TYPE_ABOUT_BLANK,
  type ProblemDetails,
} from '@docuvate/contracts';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  ConflictError,
  DomainError,
  ForbiddenError,
  GatewayTimeoutError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from '../domain/errors.js';
import { requestIdFromFastify } from '../infrastructure/http/request-id.js';
import { buildProblemDetails, problemDetailForCode } from './problem-details.builder.js';
import { RequestValidationException } from './request-validation.exception.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function statusFromDomainError(exception: DomainError): number {
  if (exception instanceof NotFoundError) return HttpStatus.NOT_FOUND;
  if (exception instanceof ForbiddenError) return HttpStatus.FORBIDDEN;
  if (exception instanceof ValidationError) return HttpStatus.UNPROCESSABLE_ENTITY;
  if (exception instanceof GatewayTimeoutError) return HttpStatus.GATEWAY_TIMEOUT;
  if (exception instanceof ServiceUnavailableError) return HttpStatus.SERVICE_UNAVAILABLE;
  if (exception instanceof ConflictError) return HttpStatus.CONFLICT;
  return HttpStatus.BAD_REQUEST;
}

function problemFromHttpException(exception: HttpException, requestId: string): ProblemDetails {
  const status = exception.getStatus();
  const response = exception.getResponse();
  let code: ErrorCode = ERROR_CODES.INTERNAL_ERROR;
  let detail = errorCodeI18nKeySafe(ERROR_CODES.INTERNAL_ERROR);

  if (status === 429) {
    code = ERROR_CODES.RATE_LIMIT_EXCEEDED;
    detail = errorCodeI18nKeySafe(code);
  } else if (status === 401) {
    code = ERROR_CODES.AUTH_SESSION_EXPIRED;
    detail = errorCodeI18nKeySafe(code);
  } else if (status === 413) {
    code = ERROR_CODES.UPLOAD_TOO_LARGE;
    detail = errorCodeI18nKeySafe(code);
  }

  if (typeof response === 'string') {
    return buildProblemDetails({ status, requestId, code, detail: response });
  }
  if (isRecord(response)) {
    const message =
      typeof response.message === 'string'
        ? response.message
        : Array.isArray(response.message)
          ? response.message.filter((item): item is string => typeof item === 'string').join('; ')
          : detail;
    return buildProblemDetails({ status, requestId, code, detail: message });
  }

  return problemDetailForCode(code, status, requestId);
}

function errorCodeI18nKeySafe(code: (typeof ERROR_CODES)[keyof typeof ERROR_CODES]): string {
  return `errors.codes.${code}`;
}

/** Maps any thrown value to the RFC 9457 body the API returns. */
export function problemForException(exception: unknown, requestId: string): ProblemDetails {
  if (exception instanceof DomainError) {
    const status = statusFromDomainError(exception);
    return {
      type: PROBLEM_TYPE_ABOUT_BLANK,
      title: problemDetailForCode(exception.code, status, requestId).title,
      status,
      code: exception.code,
      detail: exception.detailKey,
      requestId,
    };
  }
  if (exception instanceof RequestValidationException) {
    return {
      ...problemDetailForCode(ERROR_CODES.VALIDATION_FAILED, exception.getStatus(), requestId),
      invalidParams: exception.invalidParams,
    };
  }
  if (exception instanceof HttpException) {
    return problemFromHttpException(exception, requestId);
  }
  return problemDetailForCode(ERROR_CODES.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, requestId);
}

@Catch()
export class ProblemDetailsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const requestId = requestIdFromFastify(request);

    const problem = problemForException(exception, requestId);

    void reply
      .header('content-type', PROBLEM_DETAILS_MEDIA_TYPE)
      .header('x-request-id', requestId)
      .status(problem.status)
      .send(problem);
  }
}
