import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  JOB_OUTBOX_RELAY,
  JOB_OUTBOX_REPOSITORY,
  type DocumentRepository,
  type JobOutboxRelay,
  type JobOutboxRepository,
} from '../../../shared/domain/ports.js';
import { ForbiddenError, NotFoundError } from '../../../shared/domain/errors.js';

@Injectable()
export class QueueExtractionUseCase {
  private readonly logger = new Logger(QueueExtractionUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(JOB_OUTBOX_REPOSITORY) private readonly outbox: JobOutboxRepository,
    @Inject(JOB_OUTBOX_RELAY) private readonly relay: JobOutboxRelay
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
      await this.outbox.scheduleDocumentExtraction(documentId);
      try {
        await this.relay.relayOnce();
      } catch (relayError: unknown) {
        this.logger.warn(
          `Outbox relay after schedule failed for ${documentId}: ${
            relayError instanceof Error ? relayError.message : String(relayError)
          }`
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Extraction outbox schedule failed for ${documentId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      await this.documents.updateStatus(documentId, 'failed');
    }
  }
}
