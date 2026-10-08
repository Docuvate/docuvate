import { Module } from '@nestjs/common';
import { DOCUMENT_CHAT_PORT } from '../../domain/ports.js';
import { DocumentChatRouterAdapter } from './document-chat.router.adapter.js';
import { MockChatProvider } from './providers/mock-chat.provider.js';
import { OllamaChatProvider } from './providers/ollama-chat.provider.js';
import { RagOllamaChatProvider } from './providers/rag-ollama-chat.provider.js';
import { WorkerContextChatProvider } from './providers/worker-context-chat.provider.js';
import { WorkerDonutChatProvider } from './providers/worker-donut-chat.provider.js';

@Module({
  providers: [
    MockChatProvider,
    OllamaChatProvider,
    RagOllamaChatProvider,
    WorkerContextChatProvider,
    WorkerDonutChatProvider,
    DocumentChatRouterAdapter,
    { provide: DOCUMENT_CHAT_PORT, useExisting: DocumentChatRouterAdapter },
  ],
  exports: [DOCUMENT_CHAT_PORT, DocumentChatRouterAdapter],
})
export class DocumentChatModule {}
