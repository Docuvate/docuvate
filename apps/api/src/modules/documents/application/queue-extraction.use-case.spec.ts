import { describe, expect, it, vi } from 'vitest';
import type {
  DocumentRepository,
  JobOutboxRelay,
  JobOutboxRepository,
} from '../../../shared/domain/ports.js';
import type { DocumentEntity } from '../domain/document.entity.js';
import { QueueExtractionUseCase } from './queue-extraction.use-case.js';

function unused(name: string): () => Promise<never> {
  return async () => {
    throw new Error(`unexpected DocumentRepository call: ${name}`);
  };
}

function sampleDocument(id: string, userId: string): DocumentEntity {
  return {
    id,
    userId,
    filename: 'x.pdf',
    title: 'x',
    mimeType: 'application/pdf',
    storageKey: 'k',
    status: 'uploaded',
    tags: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function documentStub(partial: {
  findByIdForUser: DocumentRepository['findByIdForUser'];
  updateStatus: DocumentRepository['updateStatus'];
}): DocumentRepository {
  return {
    create: unused('create'),
    findById: unused('findById'),
    findByIdForUser: partial.findByIdForUser,
    listForUser: unused('listForUser'),
    updateStatus: partial.updateStatus,
    saveExtraction: unused('saveExtraction'),
    updateForUser: unused('updateForUser'),
    deleteForUser: unused('deleteForUser'),
    setTagsForDocument: unused('setTagsForDocument'),
    addTagToDocuments: unused('addTagToDocuments'),
    removeTagFromDocuments: unused('removeTagFromDocuments'),
    setCorrespondentForDocuments: unused('setCorrespondentForDocuments'),
    deleteDocuments: unused('deleteDocuments'),
    setContentHash: unused('setContentHash'),
    setFolderForDocuments: unused('setFolderForDocuments'),
  };
}

function outboxStub(partial: {
  scheduleDocumentExtraction: JobOutboxRepository['scheduleDocumentExtraction'];
}): JobOutboxRepository {
  return {
    scheduleDocumentExtraction: partial.scheduleDocumentExtraction,
    claimForRelay: unused('claimForRelay'),
    markEnqueued: unused('markEnqueued'),
    markRunning: unused('markRunning'),
    markDone: unused('markDone'),
    markFailedOrRetry: unused('markFailedOrRetry'),
    findById: unused('findById'),
    findActiveByDocumentId: unused('findActiveByDocumentId'),
  };
}

describe('QueueExtractionUseCase', () => {
  it('schedules outbox and kicks the relay after auth checks', async () => {
    const documents = documentStub({
      findByIdForUser: vi.fn(async () => sampleDocument('d1', 'u1')),
      updateStatus: vi.fn(),
    });
    const outbox = outboxStub({
      scheduleDocumentExtraction: vi.fn(async () => ({ outboxId: 'o1', created: true })),
    });
    const relay: JobOutboxRelay = {
      relayOnce: vi.fn(async () => 1),
    };
    const useCase = new QueueExtractionUseCase(documents, outbox, relay);

    await useCase.execute('d1', 'u1');

    expect(outbox.scheduleDocumentExtraction).toHaveBeenCalledWith('d1');
    expect(relay.relayOnce).toHaveBeenCalled();
    expect(documents.updateStatus).not.toHaveBeenCalled();
  });

  it('marks document failed when outbox schedule throws', async () => {
    const documents = documentStub({
      findByIdForUser: vi.fn(async () => sampleDocument('d1', 'u1')),
      updateStatus: vi.fn(),
    });
    const outbox = outboxStub({
      scheduleDocumentExtraction: vi.fn(async () => {
        throw new Error('db down');
      }),
    });
    const relay: JobOutboxRelay = {
      relayOnce: vi.fn(async () => 0),
    };
    const useCase = new QueueExtractionUseCase(documents, outbox, relay);

    await useCase.execute('d1', 'u1');

    expect(documents.updateStatus).toHaveBeenCalledWith('d1', 'failed');
    expect(relay.relayOnce).not.toHaveBeenCalled();
  });
});
