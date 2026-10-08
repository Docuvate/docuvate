import { Inject, Injectable } from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  EXTRACTION_PORT,
  OBJECT_STORAGE,
  type DocumentRepository,
  type ExtractionPort,
  type ObjectStorage,
} from '../../../shared/domain/ports.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { ApplyDuplicateDetectionUseCase } from '../../duplicates/application/apply-duplicate-detection.use-case.js';
import { ResolveUserExtractorEngineUseCase } from '../../settings/application/settings.use-cases.js';
import { RunDocumentPostOcrPipelineUseCase } from '../../document-pipeline/application/run-document-post-ocr-pipeline.use-case.js';
import { SyncDocumentFieldValuesUseCase } from '../../search/application/sync-document-field-values.use-case.js';
import { SyncDocumentSearchIndexUseCase } from '../../search/application/sync-document-search-index.use-case.js';

@Injectable()
export class RunExtractionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(EXTRACTION_PORT) private readonly extraction: ExtractionPort,
    private readonly postOcrPipeline: RunDocumentPostOcrPipelineUseCase,
    private readonly applyDuplicateDetection: ApplyDuplicateDetectionUseCase,
    private readonly resolveExtractorEngine: ResolveUserExtractorEngineUseCase,
    private readonly syncFieldValues: SyncDocumentFieldValuesUseCase,
    private readonly syncSearchIndex: SyncDocumentSearchIndexUseCase
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
      const result = await this.extraction.extract(buffer, doc.mimeType, { engine });
      await this.documents.saveExtraction(documentId, result);
      await this.syncFieldValues.execute(doc.userId, documentId, result.fields);
      await this.syncSearchIndex.execute(doc.userId, documentId, {
        text: result.text,
        title: doc.title,
        filename: doc.filename,
      });
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
