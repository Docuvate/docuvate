// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { PgDocumentRepresentationRepository } from '../infrastructure/pg-document-representation.repository.js';
import { EnsureDocumentRepresentationUseCase } from './ensure-document-representation.use-case.js';

@Injectable()
export class ReindexStaleRepresentationUseCase {
  private readonly logger = new Logger(ReindexStaleRepresentationUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly representations: PgDocumentRepresentationRepository,
    private readonly ensureRepresentation: EnsureDocumentRepresentationUseCase
  ) {}

  async execute(tenantId: string, documentId: string): Promise<boolean> {
    const doc = await this.documents.findByIdForUser(documentId, tenantId);
    if (doc?.status !== 'ready') {
      return false;
    }
    const text = (doc.extraction?.text ?? '').trim();
    if (text.length < 1) {
      return false;
    }
    try {
      await this.representations.deleteForDocument(tenantId, documentId);
      return await this.ensureRepresentation.execute(tenantId, documentId, text);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Encoder reindex skipped for ${documentId}: ${message}`);
      return false;
    }
  }
}
