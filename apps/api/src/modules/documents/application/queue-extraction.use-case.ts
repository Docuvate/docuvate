// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { NotFoundError, ForbiddenError } from '../../../shared/domain/errors.js';
import { ExtractionQueueService } from '../../extraction/infrastructure/extraction-queue.service.js';

@Injectable()
export class QueueExtractionUseCase {
  private readonly logger = new Logger(QueueExtractionUseCase.name);

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
    try {
      await this.queue.enqueue(documentId, userId);
      await this.documents.updateStatus(documentId, 'queued');
    } catch (error: unknown) {
      this.logger.error(
        `Extraction enqueue failed for ${documentId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      await this.documents.updateStatus(documentId, 'failed');
    }
  }
}
