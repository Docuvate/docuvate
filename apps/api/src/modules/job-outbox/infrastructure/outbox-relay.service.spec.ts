import { describe, expect, it, vi } from 'vitest';
import type { JobOutboxRepository } from '../../../shared/domain/ports.js';
import {
  JOB_TYPE_DOCUMENT_EXTRACTION,
  type JobOutboxRecord,
} from '../domain/job-outbox.types.js';
import { OutboxRelayService, type ExtractionOutboxEnqueuer } from './outbox-relay.service.js';

function unused(name: string): () => Promise<never> {
  return async () => {
    throw new Error(`unexpected JobOutboxRepository call: ${name}`);
  };
}

function sampleJob(
  overrides: Partial<JobOutboxRecord> & Pick<JobOutboxRecord, 'id' | 'documentId'>
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
      sampleJob({ id: 'o1', documentId: 'd1' }),
      sampleJob({ id: 'o2', documentId: 'd2' }),
    ];
    const outbox: JobOutboxRepository = {
      scheduleDocumentExtraction: unused('scheduleDocumentExtraction'),
      claimForRelay: vi.fn(async () => jobs),
      markEnqueued: vi.fn(async () => true),
      markRunning: unused('markRunning'),
      markDone: unused('markDone'),
      markFailedOrRetry: unused('markFailedOrRetry'),
      findById: unused('findById'),
      findActiveByDocumentId: unused('findActiveByDocumentId'),
    };
    const enqueueFromOutbox = vi.fn(async () => undefined);
    const extractionQueue: ExtractionOutboxEnqueuer = { enqueueFromOutbox };
    const relay = new OutboxRelayService(outbox, extractionQueue);

    const count = await relay.relayOnce();

    expect(count).toBe(2);
    expect(enqueueFromOutbox).toHaveBeenCalledTimes(2);
    expect(outbox.markEnqueued).toHaveBeenCalledWith('o1');
    expect(outbox.markEnqueued).toHaveBeenCalledWith('o2');
  });

  it('leaves jobs pending when Valkey enqueue fails', async () => {
    const jobs = [sampleJob({ id: 'o1', documentId: 'd1' })];
    const outbox: JobOutboxRepository = {
      scheduleDocumentExtraction: unused('scheduleDocumentExtraction'),
      claimForRelay: vi.fn(async () => jobs),
      markEnqueued: vi.fn(async () => true),
      markRunning: unused('markRunning'),
      markDone: unused('markDone'),
      markFailedOrRetry: unused('markFailedOrRetry'),
      findById: unused('findById'),
      findActiveByDocumentId: unused('findActiveByDocumentId'),
    };
    const extractionQueue: ExtractionOutboxEnqueuer = {
      enqueueFromOutbox: vi.fn(async () => {
        throw new Error('valkey down');
      }),
    };
    const relay = new OutboxRelayService(outbox, extractionQueue);

    const count = await relay.relayOnce();

    expect(count).toBe(0);
    expect(outbox.markEnqueued).not.toHaveBeenCalled();
  });
});
