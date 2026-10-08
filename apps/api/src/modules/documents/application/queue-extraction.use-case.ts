import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { NotFoundError, ForbiddenError } from '../../../shared/domain/errors.js';
import { ExtractionQueueService } from '../../extraction/infrastructure/extraction-queue.service.js';

@Injectable()
export class QueueExtractionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly queue: ExtractionQueueService
  ) {}

  async execute(documentId: string, userId: string): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    if (doc.userId !== userId) {
      throw new ForbiddenError();
    }
    await this.documents.updateStatus(documentId, 'queued');
    await this.queue.enqueue(documentId, userId);
  }
}
