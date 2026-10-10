// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
} from '../../../shared/domain/ports.js';
import { RefreshEmbeddingSuggestionsUseCase } from './refresh-embedding-suggestions.use-case.js';

const DEFAULT_BATCH = 12;

@Injectable()
export class BackfillDocumentEmbeddingsUseCase {
  private readonly logger = new Logger(BackfillDocumentEmbeddingsUseCase.name);

  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    private readonly refreshEmbeddings: RefreshEmbeddingSuggestionsUseCase
  ) {}

  /** Embeds extracted documents that never received a vector (e.g. pre-feature uploads). */
  async execute(userId: string, limit = DEFAULT_BATCH): Promise<number> {
    const ids = await this.labelEmbeddings.listDocumentIdsMissingEmbeddings(userId, limit);
    let saved = 0;
    for (const documentId of ids) {
      try {
        await this.refreshEmbeddings.execute(documentId, userId);
        const vector = await this.labelEmbeddings.getDocumentEmbedding(documentId);
        if (vector && vector.length > 0) {
          saved += 1;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Backfill embed skipped for ${documentId}: ${message}`);
      }
    }
    return saved;
  }
}
