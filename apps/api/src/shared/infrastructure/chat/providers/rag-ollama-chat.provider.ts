// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import { isRecord, parseString } from '../../database/row-parse.js';
import { buildDocumentRagSystemPrompt } from '../build-system-prompt.js';
import type {
  DocumentChatInput,
  DocumentChatProvider,
  DocumentChatResult,
} from '../chat-provider.types.js';
import { fetchWorkerRagContext } from '../fetch-worker-rag-context.js';
import { ollamaChatModel, postOllamaChat } from '../ollama-chat-request.js';

function ollamaReplyContent(raw: unknown): string {
  if (!isRecord(raw)) {
    return '';
  }
  const message = raw.message;
  if (!isRecord(message)) {
    return '';
  }
  return parseString(message.content).trim();
}

@Injectable()
export class RagOllamaChatProvider implements DocumentChatProvider {
  readonly id = 'rag-ollama' as const;

  async chat(input: DocumentChatInput): Promise<DocumentChatResult> {
    const trimmed = input.message.trim();
    if (!trimmed) {
      return {
        configured: true,
        provider: this.id,
        reply: { role: 'assistant', content: 'Bitte eine Frage zum Dokument stellen.' },
      };
    }

    const rag = await fetchWorkerRagContext(trimmed, input.context);
    if (!rag.reachable) {
      return {
        configured: false,
        provider: this.id,
        setupHint:
          'Der Extraktions-Worker ist nicht erreichbar. Administrator: WORKER_URL und Worker-Dienst prüfen.',
        reply: {
          role: 'assistant',
          content:
            'Dokument-Chat (RAG) ist vorübergehend nicht verfügbar. Bitte später erneut versuchen.',
        },
      };
    }

    const model = ollamaChatModel();
    const messages = [
      {
        role: 'system',
        content: buildDocumentRagSystemPrompt(input.context, rag.contextText, {
          ollamaModel: model,
        }),
      },
      ...input.history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: trimmed },
    ];

    let response: Response;
    try {
      response = await postOllamaChat(messages);
    } catch {
      return {
        configured: false,
        provider: this.id,
        setupHint: `Ollama antwortet nicht rechtzeitig (OLLAMA_CHAT_TIMEOUT_MS, CPU-Inferenz kann dauern). Modell ${model} prüfen.`,
        reply: {
          role: 'assistant',
          content: 'Ollama-Anfrage hat das Zeitlimit überschritten. Bitte erneut versuchen.',
        },
      };
    }

    if (!response.ok) {
      return {
        configured: false,
        provider: this.id,
        setupHint: `OLLAMA_URL prüfen und Modell ${model} laden (ollama pull ${model}).`,
        reply: {
          role: 'assistant',
          content: `Ollama-Anfrage fehlgeschlagen (${String(response.status)}).`,
        },
      };
    }

    const raw: unknown = await response.json();
    const content = ollamaReplyContent(raw);
    return {
      configured: true,
      provider: this.id,
      reply: {
        role: 'assistant',
        content: content.length > 0 ? content : 'Keine Antwort vom Modell.',
      },
    };
  }
}
