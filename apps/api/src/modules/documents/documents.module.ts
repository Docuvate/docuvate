// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { JOB_OUTBOX_RELAY } from '../../shared/domain/ports.js';
import { DocumentPipelineModule } from '../document-pipeline/document-pipeline.module.js';
import { DuplicatesModule } from '../duplicates/duplicates.module.js';
import { ExactFactsModule } from '../exact-facts/exact-facts.module.js';
import { ExtractionQueueService } from '../extraction/infrastructure/extraction-queue.service.js';
import { ExtractionFeedbackModule } from '../extraction-feedback/extraction-feedback.module.js';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module.js';
import { OutboxRelayService } from '../job-outbox/infrastructure/outbox-relay.service.js';
import { LabelsModule } from '../labels/labels.module.js';
import { RecognizedFieldsModule } from '../recognized-fields/recognized-fields.module.js';
import { RepresentationModule } from '../representation/representation.module.js';
import { SearchModule } from '../search/search.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ApplyArenaWinnerExtractionUseCase } from './application/apply-arena-winner-extraction.use-case.js';
import { BatchDocumentTagSuggestionsUseCase } from './application/batch-document-tag-suggestions.use-case.js';
import { BulkDocumentsUseCase } from './application/bulk-documents.use-case.js';
import { CompareDocumentExtractionUseCase } from './application/compare-extraction.use-case.js';
import { DeleteDocumentUseCase } from './application/delete-document.use-case.js';
import { AcceptDocumentReviewUseCase } from './application/document-review/accept-document-review.use-case.js';
import { AcceptDocumentReviewBatchUseCase } from './application/document-review/accept-document-review-batch.use-case.js';
import { ArchiveHashIdenticalDuplicateSetsUseCase } from './application/document-review/archive-hash-identical-duplicate-sets.use-case.js';
import { AutoAcceptCalibratedReviewUseCase } from './application/document-review/auto-accept-calibrated-review.use-case.js';
import { ListDocumentReviewQueueUseCase } from './application/document-review/list-document-review-queue.use-case.js';
import { PromoteHighConfidenceExtractionSuggestionsUseCase } from './application/document-review/promote-extraction-suggestions.use-case.js';
import { ExportDocumentFieldValuesUseCase } from './application/export-document-field-values.use-case.js';
import { GetDocumentUseCase } from './application/get-document.use-case.js';
import { GetDocumentContentUseCase } from './application/get-document-content.use-case.js';
import { GetDocumentExtractionImageThumbnailUseCase } from './application/get-document-extraction-image-thumbnail.use-case.js';
import { GetDocumentLayoutCompareMetricsUseCase } from './application/get-document-layout-compare-metrics.use-case.js';
import { GetDocumentLayoutComparePageUseCase } from './application/get-document-layout-compare-page.use-case.js';
import { GetDocumentLayoutCompareSummaryUseCase } from './application/get-document-layout-compare-summary.use-case.js';
import { GetDocumentLayoutHtmlUseCase } from './application/get-document-layout-html.use-case.js';
import { GetDocumentLayoutIrUseCase } from './application/get-document-layout-ir.use-case.js';
import { GetDocumentLayoutTypstUseCase } from './application/get-document-layout-typst.use-case.js';
import { GetDocumentPreviewUseCase } from './application/get-document-preview.use-case.js';
import { ListDocumentsUseCase } from './application/list-documents.use-case.js';
import { MoveDocumentsUseCase } from './application/move-documents.use-case.js';
import { QueueExtractionUseCase } from './application/queue-extraction.use-case.js';
import { RefreshHeuristicFieldSuggestionsUseCase } from './application/refresh-heuristic-field-suggestions.use-case.js';
import { RequeueDocumentExtractionUseCase } from './application/requeue-document-extraction.use-case.js';
import { RunArenaSampleCompareUseCase } from './application/run-arena-sample-compare.use-case.js';
import { RunExtractionUseCase } from './application/run-extraction.use-case.js';
import { UpdateDocumentUseCase } from './application/update-document.use-case.js';
import { UploadDocumentUseCase } from './application/upload-document.use-case.js';
import { DOCUMENT_EXTRACTION_ENQUEUE } from './domain/document-extraction-enqueue.token.js';
import { FailedDocumentExtractionReconcileService } from './infrastructure/failed-document-extraction-reconcile.service.js';
import { HeuristicFieldSuggestionsBackfillService } from './infrastructure/heuristic-field-suggestions-backfill.service.js';
import { OrphanDocumentExtractionReconcileService } from './infrastructure/orphan-document-extraction-reconcile.service.js';
import { PgDocumentReviewQueueRepository } from './infrastructure/pg-document-review-queue.repository.js';
import { PgInstallationUserCountReader } from './infrastructure/pg-installation-user-count.reader.js';
import { StaleDocumentExtractionReconcileService } from './infrastructure/stale-document-extraction-reconcile.service.js';
import { DocumentsController } from './presentation/documents.controller.js';
import { ReviewQueueController } from './presentation/review-queue.controller.js';

@Module({
  imports: [
    LabelsModule,
    DuplicatesModule,
    SettingsModule,
    DocumentPipelineModule,
    ExtractionFeedbackModule,
    SearchModule,
    RepresentationModule,
    FeatureFlagsModule,
    ExactFactsModule,
    RecognizedFieldsModule,
  ],
  controllers: [DocumentsController, ReviewQueueController],
  providers: [
    PgDocumentReviewQueueRepository,
    ListDocumentReviewQueueUseCase,
    AcceptDocumentReviewUseCase,
    AcceptDocumentReviewBatchUseCase,
    AutoAcceptCalibratedReviewUseCase,
    PromoteHighConfidenceExtractionSuggestionsUseCase,
    RefreshHeuristicFieldSuggestionsUseCase,
    HeuristicFieldSuggestionsBackfillService,
    ArchiveHashIdenticalDuplicateSetsUseCase,
    UploadDocumentUseCase,
    GetDocumentUseCase,
    ListDocumentsUseCase,
    ExportDocumentFieldValuesUseCase,
    PgInstallationUserCountReader,
    BatchDocumentTagSuggestionsUseCase,
    UpdateDocumentUseCase,
    DeleteDocumentUseCase,
    BulkDocumentsUseCase,
    MoveDocumentsUseCase,
    GetDocumentContentUseCase,
    GetDocumentPreviewUseCase,
    GetDocumentExtractionImageThumbnailUseCase,
    QueueExtractionUseCase,
    RunExtractionUseCase,
    ExtractionQueueService,
    OutboxRelayService,
    { provide: JOB_OUTBOX_RELAY, useExisting: OutboxRelayService },
    { provide: DOCUMENT_EXTRACTION_ENQUEUE, useExisting: ExtractionQueueService },
    FailedDocumentExtractionReconcileService,
    StaleDocumentExtractionReconcileService,
    OrphanDocumentExtractionReconcileService,
    CompareDocumentExtractionUseCase,
    ApplyArenaWinnerExtractionUseCase,
    RunArenaSampleCompareUseCase,
    RequeueDocumentExtractionUseCase,
    GetDocumentLayoutIrUseCase,
    GetDocumentLayoutHtmlUseCase,
    GetDocumentLayoutTypstUseCase,
    GetDocumentLayoutCompareSummaryUseCase,
    GetDocumentLayoutCompareMetricsUseCase,
    GetDocumentLayoutComparePageUseCase,
  ],
  exports: [
    UploadDocumentUseCase,
    GetDocumentContentUseCase,
    QueueExtractionUseCase,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class DocumentsModule {}
