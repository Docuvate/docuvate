// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import { resolveDocumentChatProvider } from '../../application/resolve-document-chat-provider.js';
import type { ChatMessage, DocumentChatContext, DocumentChatPort } from '../../domain/ports.js';
import type {
  DocumentChatFilePayload,
  DocumentChatProvider,
  DocumentChatProviderId,
} from './chat-provider.types.js';
import { MockChatProvider } from './providers/mock-chat.provider.js';
import { OllamaChatProvider } from './providers/ollama-chat.provider.js';
import { RagOllamaChatProvider } from './providers/rag-ollama-chat.provider.js';
import { WorkerContextChatProvider } from './providers/worker-context-chat.provider.js';
import { WorkerDonutChatProvider } from './providers/worker-donut-chat.provider.js';

@Injectable()
export class DocumentChatRouterAdapter implements DocumentChatPort {
  private readonly providers: Map<DocumentChatProviderId, DocumentChatProvider>;

  constructor(
    mock: MockChatProvider,
    ollama: OllamaChatProvider,
    ragOllama: RagOllamaChatProvider,
    contextWorker: WorkerContextChatProvider,
    donutWorker: WorkerDonutChatProvider
  ) {
    this.providers = new Map<DocumentChatProviderId, DocumentChatProvider>([
      ['mock', mock],
      ['ollama', ollama],
      ['rag-ollama', ragOllama],
      ['context', contextWorker],
      ['donut-ml', donutWorker],
    ]);
  }

  async chat(
    message: string,
    history: ChatMessage[],
    context: DocumentChatContext,
    options?: { providerId?: DocumentChatProviderId; file?: DocumentChatFilePayload }
  ): Promise<{
    reply: ChatMessage;
    configured: boolean;
    provider?: string;
    setupHint?: string;
  }> {
    const providerId = options?.providerId ?? resolveDocumentChatProvider(null);

    if (providerId === 'off') {
      return {
        configured: false,
        provider: providerId,
        setupHint:
          'Unter Einstellungen → Dokument-Chat einen Provider wählen (empfohlen: Kontext) oder DOCUMENT_CHAT_PROVIDER=context setzen.',
        reply: {
          role: 'assistant',
          content:
            'Dokument-Chat ist deaktiviert. Wählen Sie in den Einstellungen einen Chat-Provider.',
        },
      };
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      return {
        configured: false,
        provider: providerId,
        reply: {
          role: 'assistant',
          content: `Chat-Provider „${providerId}“ ist nicht registriert.`,
        },
      };
    }

    const result = await provider.chat({
      message,
      history,
      context,
      file: options?.file,
    });

    return {
      reply: result.reply,
      configured: result.configured,
      provider: result.provider,
      setupHint: result.setupHint,
    };
  }
}
