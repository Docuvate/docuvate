// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import {
  attachPagesToChunks,
  splitTextChunksWithSpans,
} from '../../cited-chat/domain/split-text-chunks-with-spans.js';
import { EnsureDocumentRepresentationUseCase } from '../../representation/application/ensure-document-representation.use-case.js';
import { PgDocumentRepresentationRepository } from '../../representation/infrastructure/pg-document-representation.repository.js';
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
    private readonly documentRepresentation: PgDocumentRepresentationRepository,
    private readonly ensureRepresentation: EnsureDocumentRepresentationUseCase
  ) {}

  async execute(
    userId: string,
    documentId: string,
    input: SyncDocumentSearchIndexInput
  ): Promise<void> {
    const text = input.text.trim();
    if (text.length > 0) {
      let units = await this.documentRepresentation.listUnitVectorsForDocument(userId, documentId);
      if (units.length === 0 && text.length > 0) {
        await this.ensureRepresentation.execute(userId, documentId, text);
        units = await this.documentRepresentation.listUnitVectorsForDocument(userId, documentId);
      }
      if (units.length > 0) {
        const spans = units.map((unit) => ({
          body: unit.body,
          page: unit.page,
          charStart: unit.charStart ?? 0,
          charEnd: unit.charEnd ?? unit.body.length,
        }));
        const vectors = units.map((unit) => {
          const vector: number[] = [];
          for (let i = 0; i < unit.vectorInt8.length; i += 1) {
            vector.push(unit.vectorInt8.readInt8(i) * unit.vectorScale);
          }
          return vector;
        });
        await this.searchRepo.indexDocumentChunks(userId, documentId, spans, vectors, {
          int8Vectors: units.map((unit) => ({
            scale: unit.vectorScale,
            bytes: unit.vectorInt8,
            binaryCode: unit.binaryCode,
          })),
        });
      } else {
        const spans = attachPagesToChunks(splitTextChunksWithSpans(text), input.blocks);
        await this.searchRepo.indexDocumentChunks(userId, documentId, spans, undefined);
      }
    }
    await this.searchRepo.upsertVocabularyTerms(userId, input.title, 'document');
    await this.searchRepo.upsertVocabularyTerms(userId, input.filename, 'document');
  }
}
