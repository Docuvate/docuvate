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
import { DuplicateClassifierService } from '../domain/duplicate-classifier.service.js';
import {
  compareInputFromDocument,
  compareInputFromEmbeddingPeer,
} from '../domain/duplicate-compare-input.js';
import { readDuplicateDetectionConfig } from '../domain/duplicate-detection.config.js';
import { int8EmbeddingDot } from '../domain/embedding-int8-similarity.js';
import { extractionTextToLines } from '../domain/extraction-lines.js';
import { HttpSmartDuplicatesAdapter } from '../infrastructure/http-smart-duplicates.adapter.js';
import { LinkDuplicatePairUseCase } from './duplicate-stack.use-cases.js';

@Injectable()
export class ApplyFuzzyDuplicateDetectionUseCase {
  private readonly logger = new Logger(ApplyFuzzyDuplicateDetectionUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly embeddings: LabelEmbeddingRepository,
    private readonly classifier: DuplicateClassifierService,
    private readonly linkDuplicatePair: LinkDuplicatePairUseCase,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase,
    private readonly smartDuplicates: HttpSmartDuplicatesAdapter
  ) {}

  async execute(documentId: string, userId: string): Promise<void> {
    const config = readDuplicateDetectionConfig();
    const flags = await this.resolveFeatureFlags.execute(userId);

    try {
      const sourceDoc = await this.documents.findByIdForUser(documentId, userId);
      if (!sourceDoc) return;

      if (flags.smartDuplicates) {
        await this.applySmartDuplicateHints(documentId, userId, sourceDoc);
        return;
      }

      const left = compareInputFromDocument(sourceDoc);
      const scored = await this.scoreEmbeddingNeighbors(userId, documentId, config);
      if (scored.length === 0) return;

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
            `Fuzzy duplicate candidate skipped ${documentId} ↔ ${hit.row.documentId}: p=${evaluation.probability.toFixed(3)}`
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
        `Fuzzy duplicate detection skipped for ${documentId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async scoreEmbeddingNeighbors(
    userId: string,
    documentId: string,
    config: ReturnType<typeof readDuplicateDetectionConfig>
  ): Promise<
    {
      row: Awaited<ReturnType<DuplicateRepository['loadEmbeddingPeersByIds']>>[number];
      similarity: number;
    }[]
  > {
    const sourceMean = await this.duplicates.getDocumentMeanInt8(userId, documentId);
    if (!sourceMean) {
      const vector = await this.embeddings.getDocumentEmbedding(documentId);
      if (!vector || vector.length === 0) return [];
      const fullCorpus = await this.duplicates.listDocumentEmbeddings(userId, documentId);
      const scoredFullCorpus = fullCorpus
        .map((row) => {
          let dot = 0;
          const len = Math.min(vector.length, row.embedding.length);
          for (let i = 0; i < len; i += 1) {
            dot += vector[i] * row.embedding[i];
          }
          return { row, similarity: dot };
        })
        .filter((entry) => entry.similarity >= config.embeddingThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, config.maxEmbeddingCandidates);
      return scoredFullCorpus;
    }

    const compact = await this.duplicates.listCompactDocumentEmbeddings(userId, documentId);
    const ranked = compact
      .map((peer) => ({
        documentId: peer.documentId,
        similarity: int8EmbeddingDot(
          sourceMean.scale,
          sourceMean.int8,
          peer.scale,
          peer.int8
        ),
      }))
      .filter((entry) => entry.similarity >= config.embeddingThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, config.maxEmbeddingCandidates);

    if (ranked.length === 0) return [];

    const peers = await this.duplicates.loadEmbeddingPeersByIds(
      userId,
      ranked.map((entry) => entry.documentId)
    );
    const peerById = new Map(peers.map((peer) => [peer.documentId, peer]));
    return ranked
      .map((entry) => {
        const row = peerById.get(entry.documentId);
        if (!row) return null;
        return { row, similarity: entry.similarity };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null);
  }

  private async applySmartDuplicateHints(
    documentId: string,
    userId: string,
    sourceDoc: NonNullable<Awaited<ReturnType<DocumentRepository['findByIdForUser']>>>
  ): Promise<void> {
    const focusLines = extractionTextToLines(sourceDoc.extraction?.text ?? null);
    if (focusLines.length === 0) return;

    const absenderField = sourceDoc.extraction?.fields.find(
      (field) => field.key === 'global:absender' || field.key === 'absender'
    );
    const absenderValue = absenderField?.value.trim() ?? null;
    const documentDate = sourceDoc.documentDate ?? null;
    const peers = await this.duplicates.listSmartDuplicatePeers(
      userId,
      documentId,
      absenderValue && absenderValue.length > 0 ? absenderValue : null,
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
