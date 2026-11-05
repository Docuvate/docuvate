// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import { ForbiddenError, NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  JOB_OUTBOX_RELAY,
  JOB_OUTBOX_REPOSITORY,
  type JobOutboxRelay,
  type JobOutboxRepository,
} from '../../../shared/domain/ports.js';

@Injectable()
export class QueueExtractionUseCase {
  private readonly logger = new Logger(QueueExtractionUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(JOB_OUTBOX_REPOSITORY) private readonly outbox: JobOutboxRepository,
    @Inject(JOB_OUTBOX_RELAY) private readonly relay: JobOutboxRelay
  ) {}

  async execute(
    documentId: string,
    userId: string,
    options?: { throwOnEnqueueFailure?: boolean }
  ): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    if (doc.userId !== userId) {
      throw new ForbiddenError();
    }
    try {
      await this.outbox.scheduleDocumentExtraction(documentId, userId);
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
      const failureReason = error instanceof Error ? error.message : String(error);
      await this.documents.updateStatus(documentId, 'failed', { failureReason });
      if (options?.throwOnEnqueueFailure) {
        throw error;
      }
    }
  }
}
