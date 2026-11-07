// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import {
  documentExtractionConcurrency,
  extractionQueueLockDurationMs,
  outboxEnqueuedLeaseMs,
  outboxRunningLeaseMs,
} from './extraction-queue.config.js';

describe('documentExtractionConcurrency', () => {
  const previous = process.env['DOCUMENT_EXTRACTION_CONCURRENCY'];

  afterEach(() => {
    if (previous === undefined) {
      delete process.env['DOCUMENT_EXTRACTION_CONCURRENCY'];
    } else {
      process.env['DOCUMENT_EXTRACTION_CONCURRENCY'] = previous;
    }
  });

  it('follows the worker capacity when env is unset (1 slot on a 2 GiB worker)', () => {
    delete process.env['DOCUMENT_EXTRACTION_CONCURRENCY'];
    expect(documentExtractionConcurrency(1)).toBe(1);
    expect(documentExtractionConcurrency(3)).toBe(3);
  });

  it('never exceeds worker capacity even when env asks for more', () => {
    process.env['DOCUMENT_EXTRACTION_CONCURRENCY'] = '4';
    expect(documentExtractionConcurrency(1)).toBe(1);
  });

  it('lets env cap below worker capacity', () => {
    process.env['DOCUMENT_EXTRACTION_CONCURRENCY'] = '2';
    expect(documentExtractionConcurrency(3)).toBe(2);
  });

  it('treats an invalid worker report as one slot', () => {
    delete process.env['DOCUMENT_EXTRACTION_CONCURRENCY'];
    expect(documentExtractionConcurrency(0)).toBe(1);
    expect(documentExtractionConcurrency(Number.NaN)).toBe(1);
  });
});

describe('outbox lease windows', () => {
  const previousEnqueued = process.env['JOB_OUTBOX_LEASE_MS'];
  const previousRunning = process.env['JOB_OUTBOX_RUNNING_LEASE_MS'];
  const previousLock = process.env['DOCUMENT_EXTRACTION_LOCK_DURATION_MS'];

  afterEach(() => {
    if (previousEnqueued === undefined) {
      delete process.env['JOB_OUTBOX_LEASE_MS'];
    } else {
      process.env['JOB_OUTBOX_LEASE_MS'] = previousEnqueued;
    }
    if (previousRunning === undefined) {
      delete process.env['JOB_OUTBOX_RUNNING_LEASE_MS'];
    } else {
      process.env['JOB_OUTBOX_RUNNING_LEASE_MS'] = previousRunning;
    }
    if (previousLock === undefined) {
      delete process.env['DOCUMENT_EXTRACTION_LOCK_DURATION_MS'];
    } else {
      process.env['DOCUMENT_EXTRACTION_LOCK_DURATION_MS'] = previousLock;
    }
  });

  it('keeps a live running attempt past the BullMQ lock unless a test override is set', () => {
    delete process.env['JOB_OUTBOX_LEASE_MS'];
    delete process.env['JOB_OUTBOX_RUNNING_LEASE_MS'];
    delete process.env['DOCUMENT_EXTRACTION_LOCK_DURATION_MS'];
    expect(outboxRunningLeaseMs()).toBeGreaterThanOrEqual(extractionQueueLockDurationMs());
    expect(outboxRunningLeaseMs()).toBeGreaterThan(outboxEnqueuedLeaseMs());
  });

  it('honours an explicit running lease shorter than the lock', () => {
    process.env['JOB_OUTBOX_RUNNING_LEASE_MS'] = '1000';
    expect(outboxRunningLeaseMs()).toBe(1000);
  });
});
