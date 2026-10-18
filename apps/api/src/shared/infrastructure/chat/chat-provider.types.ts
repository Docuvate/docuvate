// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ChatMessage, DocumentChatContext } from '../../domain/ports.js';

export type DocumentChatProviderId =
  'mock' | 'context' | 'rag-ollama' | 'ollama' | 'donut-ml' | 'off';

export interface DocumentChatFilePayload {
  buffer: Buffer;
  mimeType: string;
}

export interface DocumentChatInput {
  message: string;
  history: ChatMessage[];
  context: DocumentChatContext;
  file?: DocumentChatFilePayload;
}

export interface DocumentChatResult {
  reply: ChatMessage;
  configured: boolean;
  provider: DocumentChatProviderId;
  setupHint?: string;
}

export interface DocumentChatProvider {
  readonly id: DocumentChatProviderId;
  chat(input: DocumentChatInput): Promise<DocumentChatResult>;
}

export interface ChatProviderCatalogEntry {
  id: string;
  label: string;
  description: string;
  available: boolean;
}
