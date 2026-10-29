// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { ExtractionFailureCode } from './extraction-failure.js';
import {
  extractionFailureFromWorkerResponse,
  parseWorkerExtractErrorBody,
  type WorkerExtractErrorBody,
} from './extraction-worker-errors.js';

function body(errorCode: string, errorType: string): WorkerExtractErrorBody | null {
  return parseWorkerExtractErrorBody({ detail: { errorCode, errorType, reason: 'r' } });
}

type Case = [number, WorkerExtractErrorBody | null, ExtractionFailureCode, boolean];

const CASES: Case[] = [
  [503, body('extract_deadline_exceeded', 'ExtractDeadlineExceeded'), 'worker_deadline', true],
  [503, body('extract_client_disconnected', 'ExtractClientDisconnected'), 'worker_deadline', true],
  [503, body('extract_resource_busy', 'ExtractResourceBusy'), 'worker_busy', true],
  [503, null, 'worker_unavailable', true],
  [502, null, 'worker_unavailable', true],
  [422, body('extract_permanent_failure', 'ExtractResourceExhausted'), 'resource_exhausted', false],
  [422, body('extract_permanent_failure', 'ValueError'), 'document_unprocessable', false],
  [500, null, 'worker_error', false],
];

describe('extractionFailureFromWorkerResponse', () => {
  it.each(CASES)('status %i maps to its typed code', (status, parsed, code, retryable) => {
    const failure = extractionFailureFromWorkerResponse(status, parsed);
    expect(failure.code).toBe(code);
    expect(failure.retryable).toBe(retryable);
  });
});
