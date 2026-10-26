// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  isWorkerExtractDeadlineFailureMessage,
  isWorkerExtractDeadlineResponse,
  parseWorkerExtractErrorBody,
  workerExtractDeadlineFailureMessage,
} from './extraction-worker-errors.js';

describe('extraction-worker-errors', () => {
  it('parses FastAPI 503 detail', () => {
    const parsed = parseWorkerExtractErrorBody({
      detail: {
        errorCode: 'extract_deadline_exceeded',
        errorType: 'ExtractDeadlineExceeded',
        reason: 'extract deadline exceeded',
      },
    });
    expect(parsed?.errorType).toBe('ExtractDeadlineExceeded');
    expect(
      isWorkerExtractDeadlineResponse(503, parsed)
    ).toBe(true);
  });

  it('builds stable failure message for queue classification', () => {
    const message = workerExtractDeadlineFailureMessage({
      errorType: 'ExtractDeadlineExceeded',
      reason: 'extract deadline exceeded',
    });
    expect(isWorkerExtractDeadlineFailureMessage(message)).toBe(true);
  });
});
