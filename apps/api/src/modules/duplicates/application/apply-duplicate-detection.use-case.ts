// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  DUPLICATE_REPOSITORY,
  LABEL_EMBEDDING_REPOSITORY,
  type DocumentRepository,
  type DuplicateRepository,
  type LabelEmbeddingRepository,
} from '../../../shared/domain/ports.js';
import { cosineSimilarity } from '../../labels/domain/cosine.js';
import { evaluateEmbeddingDuplicateCandidate } from '../domain/duplicate-candidate-gates.js';
import { readDuplicateDetectionConfig } from '../domain/duplicate-detection.config.js';
import {
  signalsFromDocument,
  signalsFromEmbeddingPeer,
} from '../domain/duplicate-document-signals.js';
import { LinkDuplicatePairUseCase } from './duplicate-stack.use-cases.js';

@Injectable()
export class ApplyDuplicateDetectionUseCase {
  private readonly logger = new Logger(ApplyDuplicateDetectionUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly embeddings: LabelEmbeddingRepository,
    private readonly linkDuplicatePair: LinkDuplicatePairUseCase
  ) {}

  async execute(documentId: string, userId: string, contentHash: string | null): Promise<void> {
    const config = readDuplicateDetectionConfig();

    try {
      if (contentHash) {
        const hashMatches = await this.duplicates.findDocumentIdsByHash(
          userId,
          contentHash,
          documentId
        );
        for (const candidateId of hashMatches) {
          await this.duplicates.upsertCandidate(userId, documentId, candidateId, 1, 'hash');
          await this.linkDuplicatePair.execute(userId, documentId, candidateId);
        }
      }

      const sourceDoc = await this.documents.findByIdForUser(documentId, userId);
      if (!sourceDoc) return;
      const sourceSignals = signalsFromDocument(sourceDoc);

      const vector = await this.embeddings.getDocumentEmbedding(documentId);
      if (!vector || vector.length === 0) return;

      const others = await this.duplicates.listDocumentEmbeddings(userId, documentId);
      const scored = others
        .map((row) => ({
          row,
          similarity: cosineSimilarity(vector, row.embedding),
        }))
        .filter((entry) => entry.similarity >= config.embeddingThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, config.maxEmbeddingCandidates);

      for (const hit of scored) {
        const candidateSignals = signalsFromEmbeddingPeer(hit.row);
        const gate = evaluateEmbeddingDuplicateCandidate(
          sourceSignals,
          candidateSignals,
          hit.similarity,
          config
        );
        if (!gate.accept) {
          this.logger.debug(
            `Embedding duplicate skipped ${documentId} ↔ ${hit.row.documentId}: ${gate.reason ?? 'rejected'} (sim=${hit.similarity.toFixed(3)})`
          );
          continue;
        }

        await this.duplicates.upsertCandidate(
          userId,
          documentId,
          hit.row.documentId,
          hit.similarity,
          'embedding'
        );
        await this.linkDuplicatePair.execute(userId, documentId, hit.row.documentId);
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Duplicate detection skipped for ${documentId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
