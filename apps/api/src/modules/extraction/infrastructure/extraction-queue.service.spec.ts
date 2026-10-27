// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { UnrecoverableError } from 'bullmq';
import { describe, expect, it } from 'vitest';

import { isPermanentExtractionFailureMessage } from '../domain/extraction-queue-failures.js';

describe('isPermanentExtractionFailureMessage', () => {
  it('marks permanent worker 422 as unrecoverable', () => {
    const message = 'Worker extraction failed: 422';
    expect(isPermanentExtractionFailureMessage(message)).toBe(true);
    expect(() => {
      if (isPermanentExtractionFailureMessage(message)) {
        throw new UnrecoverableError(message);
      }
    }).toThrow(UnrecoverableError);
  });

  it('allows BullMQ retry for worker 503 admission pressure', () => {
    expect(isPermanentExtractionFailureMessage('Worker extraction failed: 503')).toBe(false);
  });

  it('allows BullMQ retry for worker unavailable responses', () => {
    expect(isPermanentExtractionFailureMessage('Worker extraction unavailable: 503')).toBe(false);
  });

  it('marks extract-deadline timeout as unrecoverable', () => {
    const message = 'documents.extractionFailedTimeout';
    expect(isPermanentExtractionFailureMessage(message)).toBe(true);
    expect(() => {
      if (isPermanentExtractionFailureMessage(message)) {
        throw new UnrecoverableError(message);
      }
    }).toThrow(UnrecoverableError);
  });
});

describe('isRetryableExtractionFailureMessage', () => {
  it('retries worker extract deadline failures', async () => {
    const { isRetryableExtractionFailureMessage } = await import(
      '../domain/extraction-queue-failures.js'
    );
    expect(
      isRetryableExtractionFailureMessage(
        'Worker extraction deadline: 503 ExtractDeadlineExceeded extract deadline exceeded'
      )
    ).toBe(true);
  });
});
