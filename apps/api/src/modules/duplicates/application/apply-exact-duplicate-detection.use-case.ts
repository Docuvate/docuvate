// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  DUPLICATE_REPOSITORY,
  type DuplicateRepository,
} from '../../../shared/domain/ports.js';
import { hashNormalizedExtractedText } from '../domain/normalized-extracted-text-hash.js';
import { LinkDuplicatePairUseCase } from './duplicate-stack.use-cases.js';

@Injectable()
export class ApplyExactDuplicateDetectionUseCase {
  private readonly logger = new Logger(ApplyExactDuplicateDetectionUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    private readonly linkDuplicatePair: LinkDuplicatePairUseCase
  ) {}

  /** O(1) indexed lookups: file bytes SHA-256 and normalized extracted-text SHA-256. */
  async execute(documentId: string, userId: string, contentHash: string | null): Promise<void> {
    try {
      if (contentHash) {
        await this.linkHashMatches(userId, documentId, contentHash);
      }

      const sourceDoc = await this.documents.findByIdForUser(documentId, userId);
      if (!sourceDoc) return;

      const textHash = hashNormalizedExtractedText(sourceDoc.extraction?.text ?? null);
      if (!textHash) return;

      await this.documents.setExtractedTextHash(documentId, textHash);

      const textMatches = await this.duplicates.findDocumentIdsByExtractedTextHash(
        userId,
        textHash,
        documentId
      );
      for (const candidateId of textMatches) {
        await this.duplicates.upsertCandidate(userId, documentId, candidateId, 1, 'hash');
        await this.linkDuplicatePair.execute(userId, documentId, candidateId);
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Exact duplicate detection skipped for ${documentId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async linkHashMatches(userId: string, documentId: string, hash: string): Promise<void> {
    const hashMatches = await this.duplicates.findDocumentIdsByHash(userId, hash, documentId);
    for (const candidateId of hashMatches) {
      await this.duplicates.upsertCandidate(userId, documentId, candidateId, 1, 'hash');
      await this.linkDuplicatePair.execute(userId, documentId, candidateId);
    }
  }
}
