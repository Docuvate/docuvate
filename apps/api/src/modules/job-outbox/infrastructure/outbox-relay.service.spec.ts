// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import type { JobOutboxRepository } from '../../../shared/domain/ports.js';
import {
  JOB_TYPE_DOCUMENT_EXTRACTION,
  type JobOutboxRecord,
} from '../domain/job-outbox.types.js';
import { type ExtractionOutboxEnqueuer,OutboxRelayService } from './outbox-relay.service.js';

function unused(name: string): () => Promise<never> {
  return () => Promise.reject(new Error(`unexpected JobOutboxRepository call: ${name}`));
}

function sampleJob(
  overrides: Partial<JobOutboxRecord> & Pick<JobOutboxRecord, 'id' | 'documentId' | 'userId'>
): JobOutboxRecord {
  const now = new Date('2026-11-05T07:00:00.000Z');
  return {
    jobType: JOB_TYPE_DOCUMENT_EXTRACTION,
    idempotencyKey: `document-extraction:${overrides.documentId}`,
    status: 'pending',
    attempts: 0,
    maxAttempts: 5,
    nextAttemptAt: now,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    enqueuedAt: null,
    startedAt: null,
    finishedAt: null,
    ...overrides,
  };
}

describe('OutboxRelayService', () => {
  it('enqueues claimed jobs and marks them enqueued', async () => {
    const jobs = [
      sampleJob({ id: 'o1', documentId: 'd1', userId: 'u1' }),
      sampleJob({ id: 'o2', documentId: 'd2', userId: 'u1' }),
    ];
    const markEnqueued = vi.fn(() => Promise.resolve(true));
    const outbox: JobOutboxRepository = {
      scheduleDocumentExtraction: unused('scheduleDocumentExtraction'),
      claimForRelay: vi.fn(() => Promise.resolve(jobs)),
      markEnqueued,
      markRunning: unused('markRunning'),
      markDone: unused('markDone'),
      markFailedOrRetry: unused('markFailedOrRetry'),
      findById: unused('findById'),
      findActiveByDocumentId: unused('findActiveByDocumentId'),
    };
    const enqueueFromOutbox = vi.fn(() => Promise.resolve());
    const extractionQueue: ExtractionOutboxEnqueuer = {
      enqueueFromOutbox,
      isReady: () => true,
    };
    const relay = new OutboxRelayService(outbox, extractionQueue);

    const count = await relay.relayOnce();

    expect(count).toBe(2);
    expect(enqueueFromOutbox).toHaveBeenCalledTimes(2);
    expect(markEnqueued).toHaveBeenCalledWith('o1');
    expect(markEnqueued).toHaveBeenCalledWith('o2');
  });

  it('leaves jobs pending when Valkey enqueue fails', async () => {
    const jobs = [sampleJob({ id: 'o1', documentId: 'd1', userId: 'u1' })];
    const markEnqueued = vi.fn(() => Promise.resolve(true));
    const outbox: JobOutboxRepository = {
      scheduleDocumentExtraction: unused('scheduleDocumentExtraction'),
      claimForRelay: vi.fn(() => Promise.resolve(jobs)),
      markEnqueued,
      markRunning: unused('markRunning'),
      markDone: unused('markDone'),
      markFailedOrRetry: unused('markFailedOrRetry'),
      findById: unused('findById'),
      findActiveByDocumentId: unused('findActiveByDocumentId'),
    };
    const extractionQueue: ExtractionOutboxEnqueuer = {
      isReady: () => true,
      enqueueFromOutbox: vi.fn(() => Promise.reject(new Error('valkey down'))),
    };
    const relay = new OutboxRelayService(outbox, extractionQueue);

    const count = await relay.relayOnce();

    expect(count).toBe(0);
    expect(markEnqueued).not.toHaveBeenCalled();
  });
});
