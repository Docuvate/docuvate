import { Injectable } from '@nestjs/common';
import { PgGlobalSearchRepository } from '../infrastructure/pg-global-search.repository.js';

export interface SyncDocumentSearchIndexInput {
  text: string;
  title: string;
  filename: string;
}

/** Persists chunk FTS index and vocabulary terms when document text/metadata changes. */
@Injectable()
export class SyncDocumentSearchIndexUseCase {
  constructor(private readonly searchRepo: PgGlobalSearchRepository) {}

  async execute(
    userId: string,
    documentId: string,
    input: SyncDocumentSearchIndexInput
  ): Promise<void> {
    const text = input.text.trim();
    if (text.length > 0) {
      await this.searchRepo.indexDocumentChunks(userId, documentId, text);
    }
    await this.searchRepo.upsertVocabularyTerms(userId, input.title, 'document');
    await this.searchRepo.upsertVocabularyTerms(userId, input.filename, 'document');
  }
}
