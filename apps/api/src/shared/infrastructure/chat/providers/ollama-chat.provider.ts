import { Injectable } from '@nestjs/common';
import { buildDocumentSystemPrompt } from '../build-system-prompt.js';
import { ollamaChatModel, postOllamaChat } from '../ollama-chat-request.js';
import type {
  DocumentChatInput,
  DocumentChatProvider,
  DocumentChatResult,
} from '../chat-provider.types.js';

@Injectable()
export class OllamaChatProvider implements DocumentChatProvider {
  readonly id = 'ollama' as const;

  async chat(input: DocumentChatInput): Promise<DocumentChatResult> {
    const trimmed = input.message.trim();
    if (!trimmed) {
      return {
        configured: true,
        provider: this.id,
        reply: { role: 'assistant', content: 'Bitte eine Frage zum Dokument stellen.' },
      };
    }

    const model = ollamaChatModel();
    const messages = [
      { role: 'system', content: buildDocumentSystemPrompt(input.context) },
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
        setupHint: `Ollama antwortet nicht rechtzeitig (OLLAMA_CHAT_TIMEOUT_MS). Modell ${model} prüfen.`,
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
          content: `Ollama-Anfrage fehlgeschlagen (${response.status}).`,
        },
      };
    }

    const data = (await response.json()) as { message?: { content?: string } };
    return {
      configured: true,
      provider: this.id,
      reply: {
        role: 'assistant',
        content: data.message?.content?.trim() || 'Keine Antwort vom Modell.',
      },
    };
  }
}
