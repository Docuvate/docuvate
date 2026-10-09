// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { buildOllamaChatBody } from './ollama-chat-options.js';

const DEFAULT_OLLAMA_CHAT_TIMEOUT_MS = 180_000;

export function ollamaChatTimeoutMs(): number {
  const raw = process.env['OLLAMA_CHAT_TIMEOUT_MS'];
  if (!raw) {
    return DEFAULT_OLLAMA_CHAT_TIMEOUT_MS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_OLLAMA_CHAT_TIMEOUT_MS;
  }
  return parsed;
}

export function ollamaChatModel(): string {
  return process.env['OLLAMA_MODEL'] ?? 'qwen2.5:1.5b';
}

export function ollamaChatBaseUrl(): string {
  return process.env['OLLAMA_URL'] ?? 'http://127.0.0.1:11434';
}

export async function postOllamaChat(
  messages: Array<{ role: string; content: string }>
): Promise<Response> {
  const ollamaUrl = ollamaChatBaseUrl();
  const model = ollamaChatModel();
  return fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildOllamaChatBody(model, messages, false)),
    signal: AbortSignal.timeout(ollamaChatTimeoutMs()),
  });
}
