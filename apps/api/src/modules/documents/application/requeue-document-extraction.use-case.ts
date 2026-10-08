import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import { QueueExtractionUseCase } from './queue-extraction.use-case.js';

@Injectable()
export class RequeueDocumentExtractionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly queueExtraction: QueueExtractionUseCase
  ) {}

  async execute(documentId: string, userId: string): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    if (doc.status === 'queued' || doc.status === 'extracting') {
      throw new ValidationError('Extraktion läuft bereits.');
    }
    await this.queueExtraction.execute(documentId, userId);
  }
}
