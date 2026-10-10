// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  EXTRACTION_PORT,
  type ExtractionPort,
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../shared/domain/ports.js';

@Injectable()
export class CompareDocumentExtractionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(EXTRACTION_PORT) private readonly extraction: ExtractionPort
  ) {}

  async execute(documentId: string, userId: string, engines: string[], maxPages?: number | null) {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    const buffer = await this.storage.getObject(doc.storageKey);
    const compared = await this.extraction.compare(buffer, doc.mimeType, engines, maxPages);
    return {
      items: compared.items,
      engines: compared.engines,
      maxPages: maxPages ?? null,
    };
  }
}
