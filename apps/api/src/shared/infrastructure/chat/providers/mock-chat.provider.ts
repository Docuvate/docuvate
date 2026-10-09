// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import type {
  DocumentChatInput,
  DocumentChatProvider,
  DocumentChatResult,
} from '../chat-provider.types.js';

@Injectable()
export class MockChatProvider implements DocumentChatProvider {
  readonly id = 'mock' as const;

  async chat(input: DocumentChatInput): Promise<DocumentChatResult> {
    const trimmed = input.message.trim();
    if (!trimmed) {
      return {
        configured: true,
        provider: this.id,
        reply: { role: 'assistant', content: 'Bitte eine Frage zum Dokument stellen.' },
      };
    }
    const snippet = (input.context.text || input.context.title).slice(0, 160);
    return {
      configured: true,
      provider: this.id,
      setupHint:
        'Entwicklungsmodus (Mock). Für echte Antworten in Einstellungen „Kontext (Embeddings)“ wählen.',
      reply: {
        role: 'assistant',
        content: `Zu Ihrer Frage „${trimmed}“ — Auszug aus dem Dokument: „${snippet}${input.context.text.length > 160 ? '…' : ''}“. (Mock-Antwort ohne LLM.)`,
      },
    };
  }
}
