import { describe, expect, it, vi } from 'vitest';
import { QueueExtractionUseCase } from './queue-extraction.use-case.js';

describe('QueueExtractionUseCase', () => {
  it('marks document queued after successful enqueue', async () => {
    const documents = {
      findByIdForUser: vi.fn(async () => ({ id: 'd1', userId: 'u1' })),
      updateStatus: vi.fn(),
    };
    const queue = { enqueue: vi.fn(async () => undefined) };
    const useCase = new QueueExtractionUseCase(documents as never, queue as never);

    await useCase.execute('d1', 'u1');

    expect(queue.enqueue).toHaveBeenCalledWith('d1', 'u1');
    expect(documents.updateStatus).toHaveBeenCalledWith('d1', 'queued');
  });

  it('marks document failed when enqueue exhausts retries', async () => {
    const documents = {
      findByIdForUser: vi.fn(async () => ({ id: 'd1', userId: 'u1' })),
      updateStatus: vi.fn(),
    };
    const queue = {
      enqueue: vi.fn(async () => {
        throw new Error('document-extraction enqueue failed after 5 attempts: ECONNREFUSED');
      }),
    };
    const useCase = new QueueExtractionUseCase(documents as never, queue as never);

    await useCase.execute('d1', 'u1');

    expect(documents.updateStatus).toHaveBeenCalledWith('d1', 'failed');
    expect(documents.updateStatus).not.toHaveBeenCalledWith('d1', 'queued');
  });
});
