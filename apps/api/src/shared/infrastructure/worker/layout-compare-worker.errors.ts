// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  GatewayTimeoutError,
  ServiceUnavailableError,
  ValidationError,
  type DomainError,
} from '../../domain/errors.js';
import { workerLayoutTimeoutError } from './worker-fetch.js';

const LAYOUT_COMPARE_MESSAGE_KEYS: Record<string, string> = {
  compile_failed: 'documents.layoutCompareErrors.compileFailed',
  rasterize_failed: 'documents.layoutCompareErrors.rasterizeFailed',
  page_out_of_range: 'documents.layoutCompareErrors.pageOutOfRange',
  pdf_too_large: 'documents.layoutCompareErrors.pdfTooLarge',
  too_many_pages: 'documents.layoutCompareErrors.tooManyPages',
  timeout: 'documents.layoutCompareErrors.timeout',
  compare_failed: 'documents.layoutCompareErrors.compareFailed',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseWorkerLayoutCompareErrorCode(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }
  const detail = body['detail'];
  if (isRecord(detail)) {
    const code = detail['errorCode'];
    if (typeof code === 'string' && code.length > 0) {
      return code;
    }
  }
  const code = body['errorCode'];
  if (typeof code === 'string' && code.length > 0) {
    return code;
  }
  return undefined;
}

export function mapWorkerLayoutCompareHttpError(status: number, errorCode?: string): DomainError {
  if (status === 504 || status === 408) {
    return workerLayoutTimeoutError();
  }
  if (status === 502 || status === 503) {
    return new ServiceUnavailableError('documents.layoutCompareErrors.workerUnavailable');
  }
  if (errorCode) {
    const message = LAYOUT_COMPARE_MESSAGE_KEYS[errorCode] ?? 'documents.layoutCompareErrors.compareFailed';
    return new ValidationError(message);
  }
  if (status === 422 || status === 413) {
    return new ValidationError('documents.layoutCompareErrors.compareFailed');
  }
  return new ServiceUnavailableError('documents.layoutCompareErrors.compareFailed');
}
