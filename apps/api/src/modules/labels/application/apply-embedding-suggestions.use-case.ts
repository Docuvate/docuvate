// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  EMBEDDING_PORT,
  type EmbeddingPort,
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { EnsureDocumentRepresentationUseCase } from '../../representation/application/ensure-document-representation.use-case.js';
import { PgDocumentRepresentationRepository } from '../../representation/infrastructure/pg-document-representation.repository.js';
import { embeddingDensityGloballyEnabled } from '../domain/embedding-density-flag.js';
import { tagIdConflictsWithAssigned } from '../domain/filter-exclusive-tag-suggestions.js';
import {
  classifyWithLabelHybrid,
  type LabelHybridDocumentRow,
} from '../domain/label-hybrid-training.js';
import { EmbeddingDensityCalibrationQueueService } from '../infrastructure/embedding-density-calibration-queue.service.js';
import { LabelHybridModelCacheService } from '../infrastructure/label-hybrid-model-cache.service.js';
import { PgLabelCoOccurrenceRepository } from '../infrastructure/pg-label-co-occurrence.repository.js';
import { PurgeExclusiveTagSuggestionsService } from '../infrastructure/purge-exclusive-tag-suggestions.service.js';
import { ApplyEmbeddingDensitySuggestionsUseCase } from './apply-embedding-density-suggestions.use-case.js';

const REJECT_PENALTY = 0.04;

@Injectable()
export class ApplyEmbeddingSuggestionsUseCase {
  private readonly logger = new Logger(ApplyEmbeddingSuggestionsUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(EMBEDDING_PORT) private readonly embedding: EmbeddingPort,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly embeddingDensity: ApplyEmbeddingDensitySuggestionsUseCase,
    private readonly densityCalibrationQueue: EmbeddingDensityCalibrationQueueService,
    private readonly documentRepresentation: PgDocumentRepresentationRepository,
    private readonly ensureRepresentation: EnsureDocumentRepresentationUseCase,
    private readonly coOccurrence: PgLabelCoOccurrenceRepository,
    private readonly purgeExclusive: PurgeExclusiveTagSuggestionsService,
    private readonly labelHybridCache: LabelHybridModelCacheService
  ) {}

  async execute(documentId: string, userId: string, content: string): Promise<void> {
    const trimmed = content.trim();
    if (trimmed.length < 20) {
      return;
    }

    try {
      const minConfidence = (await this.prefs.getForUser(userId)).labelNearSimilarityThreshold;

      let stored = await this.documentRepresentation.loadDocumentMeanVector(userId, documentId);
      if (!stored?.vector.length) {
        await this.ensureRepresentation.execute(userId, documentId, trimmed);
        stored = await this.documentRepresentation.loadDocumentMeanVector(userId, documentId);
      }
      let model: string;
      let vector: number[];
      if (stored && stored.vector.length > 0) {
        model = stored.model;
        vector = stored.vector;
      } else {
        const embedded = await this.embedding.embedTexts([trimmed]);
        model = embedded.model;
        vector = embedded.embeddings[0] ?? [];
      }
      if (vector.length === 0) {
        return;
      }

      await this.labelEmbeddings.saveDocumentEmbedding(documentId, userId, model, vector);

      if (embeddingDensityGloballyEnabled()) {
        void this.densityCalibrationQueue.scheduleUserCalibration(userId);
      }

      const densityOutcome = await this.embeddingDensity.tryApply(documentId, userId, vector);
      if (densityOutcome === 'handled') {
        return;
      }

      const assigned = new Set(
        (await this.taxonomy.listTagsForDocument(documentId)).map((t) => t.id)
      );
      const exclusivePairs = await this.coOccurrence.listMutuallyExclusiveTagPairs(userId);
      await this.purgeExclusive.purgeForDocument(userId, documentId);
      const existingSuggestions = await this.taxonomy.listSuggestions(documentId, userId);
      const ruleTags = new Set(
        existingSuggestions.filter((s) => s.source !== 'embedding').map((s) => s.tag.id)
      );

      const tags = await this.taxonomy.listTags(userId);
      const tagById = new Map(tags.map((t) => [t.id, t]));
      const [embeddingRows, readyDocs, docMeta] = await Promise.all([
        this.labelEmbeddings.listUserConfirmedDocumentEmbeddingsForUser(userId),
        this.documents.listForUser(userId, { status: 'ready' }),
        this.documents.findByIdForUser(documentId, userId),
      ]);
      const docTextById = new Map(
        readyDocs.map((doc) => [
          doc.id,
          `${doc.title}\n${doc.filename}\n${doc.extraction?.text ?? ''}`.slice(0, 12000),
        ])
      );
      const hybridRows: LabelHybridDocumentRow[] = embeddingRows.map((row) => ({
        documentId: row.documentId,
        embedding: row.embedding,
        nonInboxTagIds: row.nonInboxTagIds,
        text: docTextById.get(row.documentId) ?? row.documentId,
      }));
      if (docMeta && !hybridRows.some((row) => row.documentId === documentId)) {
        hybridRows.push({
          documentId,
          embedding: vector,
          nonInboxTagIds: [],
          text: `${docMeta.title}\n${docMeta.filename}\n${trimmed}`.slice(0, 12000),
        });
      }
      const hybridModel = await this.labelHybridCache.resolveModel(userId, hybridRows);
      if (!hybridModel) {
        return;
      }
      const prediction = classifyWithLabelHybrid(hybridModel, {
        embedding: vector,
        text: `${docMeta?.title ?? ''}\n${docMeta?.filename ?? ''}\n${trimmed}`.slice(0, 12000),
      });
      const tagId = prediction.tagId;
      if (!tagId) {
        return;
      }
      if (ruleTags.has(tagId)) {
        return;
      }
      const rejections = await this.labelEmbeddings.countRejectionsForTag(userId, tagId);
      const adjusted = Math.max(0, prediction.confidence - rejections * REJECT_PENALTY);
      if (adjusted < minConfidence) {
        return;
      }
      const tag = tagById.get(tagId);
      if (!tag) {
        return;
      }
      if (tagIdConflictsWithAssigned(tagId, assigned, exclusivePairs)) {
        return;
      }
      const pct = Math.round(adjusted * 100);
      await this.taxonomy.upsertSuggestion(
        documentId,
        tagId,
        `Label-Modell ${String(pct)}% (${tag.name})`,
        { source: 'embedding', confidence: adjusted }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Embedding suggestions skipped for ${documentId}: ${message}`);
    }
  }
}
