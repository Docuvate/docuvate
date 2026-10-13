// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface DocumentChatLlmRuntimeConfig {
  kind: 'ollama' | 'openai_compatible';
  model: string;
  baseUrl: string;
  apiKey: string | null;
}

export function documentChatCloudBaseUrlFromEnv(): string | null {
  const raw =
    process.env['DOCUMENT_CHAT_OPENAI_BASE_URL'] ??
    process.env['DOCUMENT_CHAT_CLOUD_BASE_URL'] ??
    '';
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed.replace(/\/$/, '') : null;
}

export function documentChatCloudApiKeyFromEnv(): string | null {
  const raw =
    process.env['DOCUMENT_CHAT_OPENAI_API_KEY'] ?? process.env['DOCUMENT_CHAT_CLOUD_API_KEY'] ?? '';
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function documentChatCloudModelFromEnv(): string | null {
  const raw = process.env['DOCUMENT_CHAT_OPENAI_MODEL'] ?? process.env['DOCUMENT_CHAT_CLOUD_MODEL'] ?? '';
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveDocumentChatCloudOverride(input?: {
  baseUrl?: string | null;
  apiKey?: string | null;
  model?: string | null;
}): DocumentChatLlmRuntimeConfig | null {
  const baseUrl = input?.baseUrl?.trim() || documentChatCloudBaseUrlFromEnv();
  const apiKey = input?.apiKey?.trim() || documentChatCloudApiKeyFromEnv();
  if (!baseUrl || !apiKey) {
    return null;
  }
  const model =
    input?.model?.trim() ||
    documentChatCloudModelFromEnv() ||
    process.env['OLLAMA_MODEL'] ||
    'qwen2.5:3b';
  return {
    kind: 'openai_compatible',
    model,
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey,
  };
}
