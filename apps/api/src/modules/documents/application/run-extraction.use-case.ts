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
import { ApplyDuplicateDetectionUseCase } from '../../duplicates/application/apply-duplicate-detection.use-case.js';
import { PersistDocumentFactsUseCase } from '../../exact-facts/application/persist-document-facts.use-case.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import { PgEmbeddingDensityRepository } from '../../labels/infrastructure/pg-embedding-density.repository.js';
import { PersistDocumentRepresentationUseCase } from '../../representation/application/persist-document-representation.use-case.js';
import { SyncDocumentSearchIndexUseCase } from '../../search/application/sync-document-search-index.use-case.js';
import { ResolveUserExtractorEngineUseCase } from '../../settings/application/settings.use-cases.js';

@Injectable()
export class RunExtractionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(EXTRACTION_PORT) private readonly extraction: ExtractionPort,
    private readonly postOcrPipeline: RunDocumentPostOcrPipelineUseCase,
    private readonly applyDuplicateDetection: ApplyDuplicateDetectionUseCase,
    private readonly resolveExtractorEngine: ResolveUserExtractorEngineUseCase,
    private readonly syncSearchIndex: SyncDocumentSearchIndexUseCase,
    private readonly persistRepresentation: PersistDocumentRepresentationUseCase,
    private readonly densityRepo: PgEmbeddingDensityRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase,
    private readonly persistFacts: PersistDocumentFactsUseCase
  ) {}

  async execute(documentId: string): Promise<void> {
    const doc = await this.documents.findById(documentId);
    if (!doc) {
      throw new NotFoundError('Document');
    }

    await this.documents.updateStatus(documentId, 'extracting');
    try {
      const buffer = await this.storage.getObject(doc.storageKey);
      const engine = await this.resolveExtractorEngine.execute(doc.userId);
      const tags = await this.taxonomy.listTags(doc.userId);
      const tagIds = tags.map((tag) => tag.id);
      const densityState = await this.densityRepo.loadWorkerState(doc.userId, tagIds);
      const flags = await this.resolveFeatureFlags.execute(doc.userId);
      const result = await this.extraction.extract(buffer, doc.mimeType, {
        engine,
        embeddingDensityState: densityState ?? undefined,
        buildExactFactIndex: flags.exactAnswers,
      });
      await this.documents.saveExtraction(documentId, result);
      await this.persistRepresentation.execute(
        doc.userId,
        documentId,
        result.documentRepresentation
      );
      await this.syncSearchIndex.execute(doc.userId, documentId, {
        text: result.text,
        title: doc.title,
        filename: doc.filename,
        blocks: result.blocks,
      });
      if (flags.exactAnswers) {
        await this.persistFacts.execute(
          doc.userId,
          documentId,
          result.extractedFacts ?? [],
          null
        );
      }
      const content = `${doc.filename}\n${doc.title}\n${result.text}`;
      await this.postOcrPipeline.execute(documentId, doc.userId, content);
      await this.documents.updateStatus(documentId, 'ready');
    } catch (error: unknown) {
      const contentHash =
        (await this.documents.findById(documentId))?.contentHash ?? doc.contentHash ?? null;
      await this.applyDuplicateDetection.execute(documentId, doc.userId, contentHash);
      await this.documents.updateStatus(documentId, 'failed');
      throw error;
    }
  }
}
