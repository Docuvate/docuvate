// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { isRecord, parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { ExtractionFailure, type ExtractionFailureCode } from './extraction-failure.js';

export interface WorkerExtractErrorBody {
  errorCode: string;
  errorType: string;
  reason: string;
}

export function parseWorkerExtractErrorBody(raw: unknown): WorkerExtractErrorBody | null {
  if (!isRecord(raw)) {
    return null;
  }
  const detail = isRecord(raw.detail) ? raw.detail : raw;
  const errorCode = parseString(detail.errorCode).trim();
  const errorType = parseString(detail.errorType).trim();
  const reason = parseString(detail.reason).trim();
  if (!errorType && !errorCode) {
    return null;
  }
  return { errorCode, errorType, reason };
}

function codeForWorkerResponse(
  status: number,
  body: WorkerExtractErrorBody | null
): ExtractionFailureCode {
  if (status === 503) {
    const errorCode = body?.errorCode ?? '';
    if (errorCode === 'extract_resource_busy') {
      return 'worker_busy';
    }
    if (errorCode === 'extract_deadline_exceeded' || errorCode === 'extract_client_disconnected') {
      return 'worker_deadline';
    }
    return 'worker_unavailable';
  }
  if (status === 502 || status === 504) {
    return 'worker_unavailable';
  }
  if (status === 422 && body?.errorCode === 'extract_permanent_failure') {
    return body.errorType === 'ExtractResourceExhausted'
      ? 'resource_exhausted'
      : 'document_unprocessable';
  }
  if (status === 422) {
    return 'document_unprocessable';
  }
  return 'worker_error';
}

/** Classify a non-2xx worker /v1/extract response by HTTP status and the worker's typed errorCode. */
export function extractionFailureFromWorkerResponse(
  status: number,
  body: WorkerExtractErrorBody | null
): ExtractionFailure {
  const code = codeForWorkerResponse(status, body);
  const typed = body ? ` ${body.errorCode} ${body.errorType}` : '';
  return new ExtractionFailure(code, `worker HTTP ${String(status)}${typed}`);
}
