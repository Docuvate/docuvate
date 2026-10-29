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
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { RunDocumentPostOcrPipelineUseCase } from '../../document-pipeline/application/run-document-post-ocr-pipeline.use-case.js';
import { ScheduleDuplicateDetectionUseCase } from '../../duplicates/application/schedule-duplicate-detection.use-case.js';
import { PersistDocumentFactsUseCase } from '../../exact-facts/application/persist-document-facts.use-case.js';
import {
  ExtractionFailure,
  extractionFailureReasonKey,
  toExtractionFailure,
} from '../../extraction/domain/extraction-failure.js';
import { extractionStaleClaimSeconds } from '../../extraction/domain/extraction-queue.config.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import { PgEmbeddingDensityRepository } from '../../labels/infrastructure/pg-embedding-density.repository.js';
import { PersistDocumentRepresentationUseCase } from '../../representation/application/persist-document-representation.use-case.js';
import { SyncDocumentSearchIndexUseCase } from '../../search/application/sync-document-search-index.use-case.js';
import { ResolveUserExtractorEngineUseCase } from '../../settings/application/settings.use-cases.js';
import { HEURISTIC_FIELD_EXTRACTOR_VERSION } from '../domain/heuristic-field-suggestions-fingerprint.js';
import { AutoAcceptCalibratedReviewUseCase } from './document-review/auto-accept-calibrated-review.use-case.js';
import { PromoteHighConfidenceExtractionSuggestionsUseCase } from './document-review/promote-extraction-suggestions.use-case.js';
import { persistExtractionImagesFromWorker } from './persist-extraction-images-from-worker.js';

@Injectable()
export class RunExtractionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(EXTRACTION_PORT) private readonly extraction: ExtractionPort,
    private readonly postOcrPipeline: RunDocumentPostOcrPipelineUseCase,
    private readonly scheduleDuplicateDetection: ScheduleDuplicateDetectionUseCase,
    private readonly resolveExtractorEngine: ResolveUserExtractorEngineUseCase,
    private readonly syncSearchIndex: SyncDocumentSearchIndexUseCase,
    private readonly persistRepresentation: PersistDocumentRepresentationUseCase,
    private readonly densityRepo: PgEmbeddingDensityRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase,
    private readonly persistFacts: PersistDocumentFactsUseCase,
    private readonly promoteHighConfidenceSuggestions: PromoteHighConfidenceExtractionSuggestionsUseCase,
    private readonly autoAcceptCalibratedReview: AutoAcceptCalibratedReviewUseCase
  ) {}

  async execute(documentId: string): Promise<void> {
    const doc = await this.documents.findById(documentId);
    if (!doc) {
      throw new NotFoundError('Document');
    }

    const claim = await this.documents.tryClaimForExtraction(
      documentId,
      extractionStaleClaimSeconds()
    );
    if (claim === 'already_ready') {
      return;
    }
    if (claim === 'busy') {
      throw new ExtractionFailure('claim_busy', 'document extraction already in progress');
    }
    try {
      const buffer = await this.storage.getObject(doc.storageKey);
      const engine = await this.resolveExtractorEngine.execute(doc.userId);
      const tags = await this.taxonomy.listTags(doc.userId);
      const tagIds = tags.map((tag) => tag.id);
      const densityState = await this.densityRepo.loadWorkerState(doc.userId, tagIds);
      const flags = await this.resolveFeatureFlags.execute(doc.userId);
      const { result, previewPdf } = await this.extraction.extract(buffer, doc.mimeType, {
        engine,
        embeddingDensityState: densityState ?? undefined,
        buildExactFactIndex: flags.exactAnswers,
      });
      if (previewPdf && previewPdf.length > 0) {
        const previewKey = `users/${doc.userId}/${documentId}/preview.pdf`;
        await this.storage.putObject(previewKey, previewPdf, 'application/pdf');
        await this.documents.setPreviewStorageKey(documentId, previewKey);
      }
      const { imageIngest, ...extractionWithoutImages } = result;
      await this.documents.saveExtraction(documentId, extractionWithoutImages);
      const persistedImages = await persistExtractionImagesFromWorker(
        this.storage,
        doc.userId,
        documentId,
        imageIngest ?? []
      );
      await this.documents.saveExtractionImages(documentId, persistedImages);
      const persistTasks: Promise<void>[] = [
        this.persistRepresentation.execute(
          doc.userId,
          documentId,
          result.documentRepresentation
        ),
        this.syncSearchIndex.execute(doc.userId, documentId, {
          text: result.text,
          title: doc.title,
          filename: doc.filename,
          blocks: result.blocks,
        }),
      ];
      if (flags.exactAnswers) {
        persistTasks.push(
          this.persistFacts.execute(doc.userId, documentId, result.extractedFacts ?? [], null)
        );
      }
      await Promise.all(persistTasks);
      const content = `${doc.filename}\n${doc.title}\n${result.text}`;
      await this.postOcrPipeline.execute(documentId, doc.userId, content);
      await this.promoteHighConfidenceSuggestions.execute(documentId, doc.userId);
      await this.autoAcceptCalibratedReview.execute(documentId, doc.userId);
      await this.documents.setHeuristicFieldExtractorVersion(
        documentId,
        HEURISTIC_FIELD_EXTRACTOR_VERSION
      );
      await this.documents.updateStatus(documentId, 'ready');
    } catch (error: unknown) {
      const failure = toExtractionFailure(error);
      if (failure.retryable) {
        // Release the claim so the next BullMQ attempt can claim it again.
        await this.documents.updateStatus(documentId, 'queued');
      } else {
        const contentHash =
          (await this.documents.findById(documentId))?.contentHash ?? doc.contentHash ?? null;
        await this.scheduleDuplicateDetection.execute(documentId, doc.userId, contentHash);
        await this.documents.updateStatus(documentId, 'failed', {
          failureReason: extractionFailureReasonKey(failure.code),
        });
      }
      throw failure;
    }
  }
}
