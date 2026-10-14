// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  DUPLICATE_REPOSITORY,
  type DuplicateRepository,
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
} from '../../../shared/domain/ports.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import { cosineSimilarity } from '../../labels/domain/cosine.js';
import { DuplicateClassifierService } from '../domain/duplicate-classifier.service.js';
import {
  compareInputFromDocument,
  compareInputFromEmbeddingPeer,
} from '../domain/duplicate-compare-input.js';
import { readDuplicateDetectionConfig } from '../domain/duplicate-detection.config.js';
import { extractionTextToLines } from '../domain/extraction-lines.js';
import { HttpSmartDuplicatesAdapter } from '../infrastructure/http-smart-duplicates.adapter.js';
import { LinkDuplicatePairUseCase } from './duplicate-stack.use-cases.js';

@Injectable()
export class ApplyDuplicateDetectionUseCase {
  private readonly logger = new Logger(ApplyDuplicateDetectionUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly embeddings: LabelEmbeddingRepository,
    private readonly classifier: DuplicateClassifierService,
    private readonly linkDuplicatePair: LinkDuplicatePairUseCase,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase,
    private readonly smartDuplicates: HttpSmartDuplicatesAdapter
  ) {}

  async execute(documentId: string, userId: string, contentHash: string | null): Promise<void> {
    const config = readDuplicateDetectionConfig();
    const flags = await this.resolveFeatureFlags.execute(userId);

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

      if (flags.smartDuplicates) {
        await this.applySmartDuplicateHints(documentId, userId, sourceDoc);
        return;
      }

      const left = compareInputFromDocument(sourceDoc);

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
        const right = compareInputFromEmbeddingPeer(hit.row);
        const evaluation = await this.classifier.evaluate(userId, {
          left,
          right,
          embeddingSimilarity: hit.similarity,
          perceptualPageHashDistance: null,
        });

        if (evaluation.decision === 'ignore') {
          this.logger.debug(
            `Duplicate candidate skipped ${documentId} ↔ ${hit.row.documentId}: p=${evaluation.probability.toFixed(3)}`
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

        if (evaluation.decision === 'auto_stack') {
          await this.linkDuplicatePair.execute(userId, documentId, hit.row.documentId);
        }
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Duplicate detection skipped for ${documentId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async applySmartDuplicateHints(
    documentId: string,
    userId: string,
    sourceDoc: NonNullable<Awaited<ReturnType<DocumentRepository['findByIdForUser']>>>
  ): Promise<void> {
    const focusLines = extractionTextToLines(sourceDoc.extraction?.text ?? null);
    if (focusLines.length === 0) return;

    const correspondentId = sourceDoc.correspondent?.id ?? null;
    const documentDate = sourceDoc.documentDate ?? null;
    const peers = await this.duplicates.listSmartDuplicatePeers(
      userId,
      documentId,
      correspondentId,
      documentDate
    );
    if (peers.length === 0) return;

    const peerInputs = peers
      .map((peer) => ({
        documentId: peer.documentId,
        lines: extractionTextToLines(peer.extractedText),
      }))
      .filter((peer) => peer.lines.length > 0);

    if (peerInputs.length === 0) return;

    const hits = await this.smartDuplicates.detectCandidates(documentId, focusLines, peerInputs);
    for (const hit of hits) {
      if (await this.duplicates.isPairDismissed(userId, documentId, hit.documentId)) {
        continue;
      }
      await this.duplicates.upsertCandidate(
        userId,
        documentId,
        hit.documentId,
        hit.similarity,
        'smart'
      );
    }
  }
}
