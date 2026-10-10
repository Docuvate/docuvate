// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
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
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class DocumentChatModule {}
