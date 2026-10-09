// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type { ExtractionBlock } from '@docuvate/contracts';
import { EMBEDDING_PORT, type EmbeddingPort } from '../../../shared/domain/ports.js';
import {
  attachPagesToChunks,
  chunkIndexText,
  splitTextChunksWithSpans,
} from '../../cited-chat/domain/split-text-chunks-with-spans.js';
import { PgGlobalSearchRepository } from '../infrastructure/pg-global-search.repository.js';

export interface SyncDocumentSearchIndexInput {
  text: string;
  title: string;
  filename: string;
  blocks?: ExtractionBlock[];
}

/** Persists chunk FTS index and vocabulary terms when document text/metadata changes. */
@Injectable()
export class SyncDocumentSearchIndexUseCase {
  constructor(
    private readonly searchRepo: PgGlobalSearchRepository,
    @Inject(EMBEDDING_PORT) private readonly embedding: EmbeddingPort
  ) {}

  async execute(
    userId: string,
    documentId: string,
    input: SyncDocumentSearchIndexInput
  ): Promise<void> {
    const text = input.text.trim();
    if (text.length > 0) {
      const spans = attachPagesToChunks(splitTextChunksWithSpans(text), input.blocks);
      let vectors: number[][] | undefined;
      try {
        const indexTexts = spans.map((s) => chunkIndexText(input.title, s.body));
        const result = await this.embedding.embedTexts(indexTexts);
        vectors = result.embeddings;
      } catch {
        vectors = undefined;
      }
      await this.searchRepo.indexDocumentChunks(userId, documentId, spans, vectors);
    }
    await this.searchRepo.upsertVocabularyTerms(userId, input.title, 'document');
    await this.searchRepo.upsertVocabularyTerms(userId, input.filename, 'document');
  }
}
