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
import { RunDocumentPostOcrPipelineUseCase } from '../../document-pipeline/application/run-document-post-ocr-pipeline.use-case.js';
import { SyncDocumentSearchIndexUseCase } from '../../search/application/sync-document-search-index.use-case.js';

@Injectable()
export class ApplyArenaWinnerExtractionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(EXTRACTION_PORT) private readonly extraction: ExtractionPort,
    private readonly postOcrPipeline: RunDocumentPostOcrPipelineUseCase,
    private readonly syncSearchIndex: SyncDocumentSearchIndexUseCase
  ) {}

  async execute(documentId: string, userId: string, winnerEngine: string): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }

    const buffer = await this.storage.getObject(doc.storageKey);
    const result = await this.extraction.extract(buffer, doc.mimeType, { engine: winnerEngine });
    await this.documents.saveExtraction(documentId, result);
    await this.syncSearchIndex.execute(doc.userId, documentId, {
      text: result.text,
      title: doc.title,
      filename: doc.filename,
    });

    const content = `${doc.filename}\n${doc.title}\n${result.text}`;
    await this.postOcrPipeline.execute(documentId, doc.userId, content);

    if (doc.status === 'failed' || doc.status === 'extracting') {
      await this.documents.updateStatus(documentId, 'ready');
    }
  }
}
