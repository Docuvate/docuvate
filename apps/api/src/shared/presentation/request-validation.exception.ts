// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/** A request body, query or path failed DTO validation. */
export class RequestValidationException extends BadRequestException {
  constructor(readonly invalidParams: string[]) {
    super('errors.codes.VALIDATION_FAILED');
  }
}

function collectPaths(errors: ValidationError[], prefix: string, into: Set<string>): void {
  for (const error of errors) {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    if (error.constraints && Object.keys(error.constraints).length > 0) {
      into.add(path);
    }
    if (error.children && error.children.length > 0) {
      collectPaths(error.children, path, into);
    }
  }
}

/** Flattens class-validator errors into dotted property paths, without submitted values. */
function invalidParamsFromValidationErrors(errors: ValidationError[]): string[] {
  const paths = new Set<string>();
  collectPaths(errors, '', paths);
  return [...paths];
}

/** `ValidationPipe.exceptionFactory` that keeps the failing property names for the client. */
export function requestValidationExceptionFactory(
  errors: ValidationError[]
): RequestValidationException {
  return new RequestValidationException(invalidParamsFromValidationErrors(errors));
}
