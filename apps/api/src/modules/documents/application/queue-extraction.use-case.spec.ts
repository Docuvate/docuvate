// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  JOB_OUTBOX_RELAY,
  JOB_OUTBOX_REPOSITORY,
  type JobOutboxRelay,
  type JobOutboxRepository,
} from '../../../shared/domain/ports.js';
import type { DocumentStatus } from '../domain/document.entity.js';
import { QueueExtractionUseCase } from './queue-extraction.use-case.js';

type UpdateStatusFn = DocumentRepository['updateStatus'];

function unusedRepo(name: string): () => Promise<never> {
  return () => Promise.reject(new Error(`unexpected JobOutboxRepository call: ${name}`));
}

async function buildUseCase(
  documents: {
    findByIdForUser: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn<UpdateStatusFn>>;
  },
  outbox: Pick<JobOutboxRepository, 'scheduleDocumentExtraction'>,
  relay: Pick<JobOutboxRelay, 'relayOnce'>
) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: QueueExtractionUseCase,
        useFactory: (
          documentRepository: DocumentRepository,
          jobOutbox: JobOutboxRepository,
          jobRelay: JobOutboxRelay
        ) => new QueueExtractionUseCase(documentRepository, jobOutbox, jobRelay),
        inject: [DOCUMENT_REPOSITORY, JOB_OUTBOX_REPOSITORY, JOB_OUTBOX_RELAY],
      },
      { provide: DOCUMENT_REPOSITORY, useValue: documents },
      {
        provide: JOB_OUTBOX_REPOSITORY,
        useValue: {
          scheduleDocumentExtraction: outbox.scheduleDocumentExtraction,
          claimForRelay: unusedRepo('claimForRelay'),
          markEnqueued: unusedRepo('markEnqueued'),
          markRunning: unusedRepo('markRunning'),
          markDone: unusedRepo('markDone'),
          markFailedOrRetry: unusedRepo('markFailedOrRetry'),
          findById: unusedRepo('findById'),
          findActiveByDocumentId: unusedRepo('findActiveByDocumentId'),
        },
      },
      { provide: JOB_OUTBOX_RELAY, useValue: relay },
    ],
  }).compile();
  return moduleRef.get(QueueExtractionUseCase);
}

describe('QueueExtractionUseCase', () => {
  it('schedules outbox then relays once', async () => {
    const documents = {
      findByIdForUser: vi.fn(() => Promise.resolve({ id: 'd1', userId: 'u1' })),
      updateStatus: vi.fn<UpdateStatusFn>(),
    };
    const scheduleDocumentExtraction = vi.fn(() =>
      Promise.resolve({ outboxId: 'o1', created: true })
    );
    const relayOnce = vi.fn(() => Promise.resolve(1));
    const useCase = await buildUseCase(documents, { scheduleDocumentExtraction }, { relayOnce });

    await useCase.execute('d1', 'u1');

    expect(scheduleDocumentExtraction).toHaveBeenCalledWith('d1', 'u1');
    expect(relayOnce).toHaveBeenCalledTimes(1);
    expect(documents.updateStatus).not.toHaveBeenCalled();
  });

  it('marks document failed when outbox schedule fails', async () => {
    const documents = {
      findByIdForUser: vi.fn(() => Promise.resolve({ id: 'd1', userId: 'u1' })),
      updateStatus: vi.fn<UpdateStatusFn>(),
    };
    const scheduleDocumentExtraction = vi.fn(() =>
      Promise.reject(new Error('outbox insert failed'))
    );
    const relayOnce = vi.fn(() => Promise.resolve(0));
    const useCase = await buildUseCase(documents, { scheduleDocumentExtraction }, { relayOnce });

    await useCase.execute('d1', 'u1');

    const failedCall = documents.updateStatus.mock.calls.find(
      (
        call
      ): call is [string, Extract<DocumentStatus, 'failed'>, { failureReason?: string | null }] =>
        call[1] === 'failed'
    );
    expect(failedCall?.[0]).toBe('d1');
    expect(typeof failedCall?.[2]?.failureReason).toBe('string');
    expect(String(failedCall?.[2]?.failureReason).length).toBeGreaterThan(0);
    expect(relayOnce).not.toHaveBeenCalled();
  });

  it('does not mark another tenant document failed when schedule refuses it', async () => {
    const documents = {
      findByIdForUser: vi.fn(() => Promise.resolve({ id: 'd1', userId: 'u1' })),
      updateStatus: vi.fn<UpdateStatusFn>(),
    };
    const scheduleDocumentExtraction = vi.fn(() => Promise.reject(new ForbiddenError('document')));
    const useCase = await buildUseCase(
      documents,
      { scheduleDocumentExtraction },
      { relayOnce: vi.fn(() => Promise.resolve(0)) }
    );

    await expect(useCase.execute('d1', 'u1')).rejects.toBeInstanceOf(ForbiddenError);
    expect(documents.updateStatus).not.toHaveBeenCalled();
  });

  it('rethrows schedule errors when throwOnEnqueueFailure is set', async () => {
    const err = new Error('database unavailable');
    const documents = {
      findByIdForUser: vi.fn(() => Promise.resolve({ id: 'd1', userId: 'u1' })),
      updateStatus: vi.fn<UpdateStatusFn>(),
    };
    const scheduleDocumentExtraction = vi.fn(() => Promise.reject(err));
    const useCase = await buildUseCase(
      documents,
      { scheduleDocumentExtraction },
      { relayOnce: vi.fn(() => Promise.resolve(0)) }
    );

    await expect(useCase.execute('d1', 'u1', { throwOnEnqueueFailure: true })).rejects.toThrow(err);
  });

  it('keeps the document queued when Valkey relay fails after schedule', async () => {
    const documents = {
      findByIdForUser: vi.fn(() => Promise.resolve({ id: 'd1', userId: 'u1' })),
      updateStatus: vi.fn<UpdateStatusFn>(),
    };
    const scheduleDocumentExtraction = vi.fn(() =>
      Promise.resolve({ outboxId: 'o1', created: true })
    );
    const relayOnce = vi.fn(() => Promise.reject(new Error('valkey down')));
    const useCase = await buildUseCase(documents, { scheduleDocumentExtraction }, { relayOnce });

    await useCase.execute('d1', 'u1');

    expect(scheduleDocumentExtraction).toHaveBeenCalled();
    expect(documents.updateStatus).not.toHaveBeenCalledWith('d1', 'failed', expect.anything());
  });
});
