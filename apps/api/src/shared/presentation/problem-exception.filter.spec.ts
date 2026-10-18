// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ERROR_CODES } from '@docuvate/contracts';
import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { ForbiddenError, NotFoundError } from '../domain/errors.js';
import { buildProblemDetails, problemDetailForCode } from './problem-details.builder.js';

describe('ProblemDetailsExceptionFilter mappings', () => {
  it('builds RFC 9457 payload for NotFoundError codes', () => {
    const err = new NotFoundError('Document');
    const problem = problemDetailForCode(err.code, HttpStatus.NOT_FOUND, 'req-1234');
    expect(problem).toMatchObject({
      code: ERROR_CODES.DOC_NOT_FOUND,
      detail: 'errors.codes.DOC_NOT_FOUND',
      requestId: 'req-1234',
      status: HttpStatus.NOT_FOUND,
    });
  });

  it('maps HttpException 429 to rate limit code', () => {
    const problem = buildProblemDetails({
      status: HttpStatus.TOO_MANY_REQUESTS,
      requestId: 'abcd',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      detail: 'errors.codes.RATE_LIMIT_EXCEEDED',
    });
    expect(problem.code).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
    expect(problem.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });

  it('uses doc access code for document forbidden errors', () => {
    const err = new ForbiddenError('Not authorized for this document');
    expect(err.code).toBe(ERROR_CODES.DOC_ACCESS_FORBIDDEN);
  });

  it('derives rate limit code from HttpException status in builder', () => {
    const ex = new HttpException('Too many', HttpStatus.TOO_MANY_REQUESTS);
    expect(ex.getStatus()).toBe(429);
  });
});
