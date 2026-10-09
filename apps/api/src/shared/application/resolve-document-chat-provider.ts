// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatProviderId } from '../infrastructure/chat/chat-provider.types.js';

const PROVIDER_IDS: DocumentChatProviderId[] = [
  'mock',
  'context',
  'rag-ollama',
  'ollama',
  'donut-ml',
  'off',
];

function normalizeProvider(raw: string | undefined | null): DocumentChatProviderId | null {
  if (!raw) {
    return null;
  }
  const value = raw.trim().toLowerCase();
  if (value === 'donut' || value === 'donut_ml') {
    return 'donut-ml';
  }
  if (value === 'worker' || value === 'default') {
    return 'context';
  }
  if (PROVIDER_IDS.includes(value as DocumentChatProviderId)) {
    return value as DocumentChatProviderId;
  }
  return null;
}

function legacyMode(): DocumentChatProviderId | null {
  const mode = process.env['DOCUMENT_CHAT_MODE']?.toLowerCase();
  if (mode === 'mock' || mode === 'ollama' || mode === 'off') {
    return mode;
  }
  return null;
}

export function resolveDocumentChatProvider(
  userPreference?: string | null
): DocumentChatProviderId {
  const fromUser = normalizeProvider(userPreference);
  if (fromUser && fromUser !== 'off') {
    return fromUser;
  }

  const fromEnv = normalizeProvider(process.env['DOCUMENT_CHAT_PROVIDER']) ?? legacyMode();
  if (fromEnv) {
    return fromEnv;
  }

  if (process.env['OLLAMA_URL']) {
    return process.env['WORKER_URL'] ? 'rag-ollama' : 'ollama';
  }
  if (process.env['WORKER_URL']) {
    return 'context';
  }
  return 'off';
}
