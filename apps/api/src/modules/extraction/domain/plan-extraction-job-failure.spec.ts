// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { DocumentStatus } from '../../documents/domain/document.entity.js';
import { ExtractionFailure } from './extraction-failure.js';
import { planExtractionJobFailed, planProcessorFailure } from './plan-extraction-job-failure.js';

describe('planProcessorFailure', () => {
  it('makes permanent typed failures unrecoverable', () => {
    const failure = new ExtractionFailure('resource_exhausted', 'worker HTTP 422');
    expect(planProcessorFailure({ failure, attemptsMade: 0, deadlineMaxRetries: 3 })).toEqual({
      kind: 'unrecoverable',
    });
  });

  it('retries worker busy and deadline below the bound', () => {
    expect(
      planProcessorFailure({
        failure: new ExtractionFailure('worker_busy', 'worker HTTP 503'),
        attemptsMade: 4,
        deadlineMaxRetries: 3,
      })
    ).toEqual({ kind: 'retry' });
    expect(
      planProcessorFailure({
        failure: new ExtractionFailure('worker_deadline', 'worker HTTP 503'),
        attemptsMade: 1,
        deadlineMaxRetries: 3,
      })
    ).toEqual({ kind: 'retry' });
  });

  it('fails the document when the deadline retry bound is reached', () => {
    expect(
      planProcessorFailure({
        failure: new ExtractionFailure('worker_deadline', 'worker HTTP 503'),
        attemptsMade: 2,
        deadlineMaxRetries: 3,
      })
    ).toEqual({
      kind: 'fail_document',
      failureReason: 'documents.errors.extractionDeadlineExceeded',
    });
  });
});

describe('planExtractionJobFailed', () => {
  const busy = new ExtractionFailure('worker_busy', 'worker HTTP 503');

  it('persists the typed reason once BullMQ retries are exhausted', () => {
    expect(
      planExtractionJobFailed({
        jobName: 'extract',
        jobFinallyFailed: true,
        documentStatus: 'queued',
        error: busy,
      })
    ).toBe('documents.extractionFailureCode.worker_busy');
  });

  it('maps untyped errors (e.g. stalled-limit) to internal_error', () => {
    expect(
      planExtractionJobFailed({
        jobName: 'extract',
        jobFinallyFailed: true,
        documentStatus: 'extracting',
        error: new Error('job stalled more than allowable limit'),
      })
    ).toBe('documents.extractionFailureCode.internal_error');
  });

  it('does nothing while a retry is pending, for terminal documents, or other job names', () => {
    const base: { jobName: string; jobFinallyFailed: boolean; documentStatus: DocumentStatus | null } = {
      jobName: 'extract',
      jobFinallyFailed: true,
      documentStatus: 'queued',
    };
    expect(planExtractionJobFailed({ ...base, jobFinallyFailed: false, error: busy })).toBeNull();
    expect(planExtractionJobFailed({ ...base, documentStatus: 'failed', error: busy })).toBeNull();
    expect(planExtractionJobFailed({ ...base, documentStatus: 'ready', error: busy })).toBeNull();
    expect(planExtractionJobFailed({ ...base, jobName: 'arena-sample', error: busy })).toBeNull();
    expect(planExtractionJobFailed({ ...base, documentStatus: null, error: busy })).toBeNull();
  });
});
