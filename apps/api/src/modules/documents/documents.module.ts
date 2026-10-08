import { Module } from '@nestjs/common';
import { DocumentsController } from './presentation/documents.controller.js';
import { UploadDocumentUseCase } from './application/upload-document.use-case.js';
import { GetDocumentUseCase } from './application/get-document.use-case.js';
import { ListDocumentsUseCase } from './application/list-documents.use-case.js';
import { QueueExtractionUseCase } from './application/queue-extraction.use-case.js';
import { RunExtractionUseCase } from './application/run-extraction.use-case.js';
import { UpdateDocumentUseCase } from './application/update-document.use-case.js';
import { DeleteDocumentUseCase } from './application/delete-document.use-case.js';
import { BulkDocumentsUseCase } from './application/bulk-documents.use-case.js';
import { GetDocumentContentUseCase } from './application/get-document-content.use-case.js';
import { DocumentChatUseCase } from './application/document-chat.use-case.js';
import { ListDocumentChatThreadsUseCase } from './application/list-document-chat-threads.use-case.js';
import { CreateDocumentChatThreadUseCase } from './application/create-document-chat-thread.use-case.js';
import { ListDocumentChatThreadMessagesUseCase } from './application/list-document-chat-thread-messages.use-case.js';
import { SendDocumentChatThreadMessageUseCase } from './application/send-document-chat-thread-message.use-case.js';
import { RunDocumentChatGenerationUseCase } from './application/run-document-chat-generation.use-case.js';
import { DocumentChatGenerationQueueService } from './infrastructure/document-chat-generation-queue.service.js';
import { DocumentChatGenerationCancelRegistry } from './infrastructure/document-chat-generation-cancel.registry.js';
import { CancelDocumentChatGenerationUseCase } from './application/cancel-document-chat-generation.use-case.js';
import { RetryDocumentChatMessageUseCase } from './application/retry-document-chat-message.use-case.js';
import { StreamDocumentChatMessageUseCase } from './application/stream-document-chat-message.use-case.js';
import { PgDocumentChatThreadRepository } from './infrastructure/pg-document-chat-thread.repository.js';
import { DOCUMENT_CHAT_THREAD_REPOSITORY } from '../../shared/domain/ports.js';
import { ExtractionQueueService } from '../extraction/infrastructure/extraction-queue.service.js';
import { LabelsModule } from '../labels/labels.module.js';
import { DuplicatesModule } from '../duplicates/duplicates.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { DocumentPipelineModule } from '../document-pipeline/document-pipeline.module.js';
import { CompareDocumentExtractionUseCase } from './application/compare-extraction.use-case.js';
import { ApplyArenaWinnerExtractionUseCase } from './application/apply-arena-winner-extraction.use-case.js';
import { RunArenaSampleCompareUseCase } from './application/run-arena-sample-compare.use-case.js';
import { RequeueDocumentExtractionUseCase } from './application/requeue-document-extraction.use-case.js';
import { ExtractionFeedbackModule } from '../extraction-feedback/extraction-feedback.module.js';
import { DocumentChatModule } from '../../shared/infrastructure/chat/document-chat.module.js';

@Module({
  imports: [
    DocumentChatModule,
    LabelsModule,
    DuplicatesModule,
    SettingsModule,
    DocumentPipelineModule,
    ExtractionFeedbackModule,
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
    DocumentChatGenerationCancelRegistry,
    CancelDocumentChatGenerationUseCase,
    RetryDocumentChatMessageUseCase,
    StreamDocumentChatMessageUseCase,
    PgDocumentChatThreadRepository,
    { provide: DOCUMENT_CHAT_THREAD_REPOSITORY, useExisting: PgDocumentChatThreadRepository },
    CompareDocumentExtractionUseCase,
    ApplyArenaWinnerExtractionUseCase,
    RunArenaSampleCompareUseCase,
    RequeueDocumentExtractionUseCase,
  ],
  exports: [UploadDocumentUseCase, GetDocumentContentUseCase],
})
export class DocumentsModule {}
