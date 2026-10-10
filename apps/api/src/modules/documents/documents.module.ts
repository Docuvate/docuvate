// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { DocumentChatModule } from '../../shared/infrastructure/chat/document-chat.module.js';
import { ChatInfrastructureModule } from '../chat-infrastructure/chat-infrastructure.module.js';
import { CitedChatModule } from '../cited-chat/cited-chat.module.js';
import { DocumentPipelineModule } from '../document-pipeline/document-pipeline.module.js';
import { DuplicatesModule } from '../duplicates/duplicates.module.js';
import { ExtractionQueueService } from '../extraction/infrastructure/extraction-queue.service.js';
import { ExtractionFeedbackModule } from '../extraction-feedback/extraction-feedback.module.js';
import { LabelsModule } from '../labels/labels.module.js';
import { SearchModule } from '../search/search.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ApplyArenaWinnerExtractionUseCase } from './application/apply-arena-winner-extraction.use-case.js';
import { BulkDocumentsUseCase } from './application/bulk-documents.use-case.js';
import { CancelDocumentChatGenerationUseCase } from './application/cancel-document-chat-generation.use-case.js';
import { CompareDocumentExtractionUseCase } from './application/compare-extraction.use-case.js';
import { CreateDocumentChatThreadUseCase } from './application/create-document-chat-thread.use-case.js';
import { DeleteDocumentUseCase } from './application/delete-document.use-case.js';
import { DocumentChatUseCase } from './application/document-chat.use-case.js';
import { GetDocumentUseCase } from './application/get-document.use-case.js';
import { GetDocumentContentUseCase } from './application/get-document-content.use-case.js';
import { GetDocumentLayoutCompareMetricsUseCase } from './application/get-document-layout-compare-metrics.use-case.js';
import { GetDocumentLayoutComparePageUseCase } from './application/get-document-layout-compare-page.use-case.js';
import { GetDocumentLayoutCompareSummaryUseCase } from './application/get-document-layout-compare-summary.use-case.js';
import { GetDocumentLayoutHtmlUseCase } from './application/get-document-layout-html.use-case.js';
import { GetDocumentLayoutIrUseCase } from './application/get-document-layout-ir.use-case.js';
import { GetDocumentLayoutTypstUseCase } from './application/get-document-layout-typst.use-case.js';
import { ListDocumentChatThreadMessagesUseCase } from './application/list-document-chat-thread-messages.use-case.js';
import { ListDocumentChatThreadsUseCase } from './application/list-document-chat-threads.use-case.js';
import { ListDocumentsUseCase } from './application/list-documents.use-case.js';
import { QueueExtractionUseCase } from './application/queue-extraction.use-case.js';
import { RequeueDocumentExtractionUseCase } from './application/requeue-document-extraction.use-case.js';
import { RetryDocumentChatMessageUseCase } from './application/retry-document-chat-message.use-case.js';
import { RunArenaSampleCompareUseCase } from './application/run-arena-sample-compare.use-case.js';
import { RunDocumentChatGenerationUseCase } from './application/run-document-chat-generation.use-case.js';
import { RunExtractionUseCase } from './application/run-extraction.use-case.js';
import { SendDocumentChatThreadMessageUseCase } from './application/send-document-chat-thread-message.use-case.js';
import { StreamDocumentChatMessageUseCase } from './application/stream-document-chat-message.use-case.js';
import { UpdateDocumentUseCase } from './application/update-document.use-case.js';
import { UploadDocumentUseCase } from './application/upload-document.use-case.js';
import { DocumentChatGenerationActiveRegistry } from './infrastructure/document-chat-generation-active.registry.js';
import { DocumentChatGenerationCancelRegistry } from './infrastructure/document-chat-generation-cancel.registry.js';
import { DocumentChatGenerationQueueService } from './infrastructure/document-chat-generation-queue.service.js';
import { StaleChatGenerationReconcileService } from './infrastructure/stale-chat-generation-reconcile.service.js';
import { DocumentsController } from './presentation/documents.controller.js';

@Module({
  imports: [
    DocumentChatModule,
    LabelsModule,
    DuplicatesModule,
    SettingsModule,
    DocumentPipelineModule,
    ExtractionFeedbackModule,
    SearchModule,
    CitedChatModule,
    ChatInfrastructureModule,
  ],
  controllers: [DocumentsController],
  providers: [
    UploadDocumentUseCase,
    GetDocumentUseCase,
    ListDocumentsUseCase,
    UpdateDocumentUseCase,
    DeleteDocumentUseCase,
    BulkDocumentsUseCase,
    GetDocumentContentUseCase,
    QueueExtractionUseCase,
    RunExtractionUseCase,
    ExtractionQueueService,
    DocumentChatUseCase,
    ListDocumentChatThreadsUseCase,
    CreateDocumentChatThreadUseCase,
    ListDocumentChatThreadMessagesUseCase,
    SendDocumentChatThreadMessageUseCase,
    RunDocumentChatGenerationUseCase,
    DocumentChatGenerationQueueService,
    StaleChatGenerationReconcileService,
    DocumentChatGenerationActiveRegistry,
    DocumentChatGenerationCancelRegistry,
    CancelDocumentChatGenerationUseCase,
    RetryDocumentChatMessageUseCase,
    StreamDocumentChatMessageUseCase,
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
    ListDocumentChatThreadMessagesUseCase,
    StreamDocumentChatMessageUseCase,
    CancelDocumentChatGenerationUseCase,
    RetryDocumentChatMessageUseCase,
    DocumentChatGenerationQueueService,
    ChatInfrastructureModule,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class DocumentsModule {}
