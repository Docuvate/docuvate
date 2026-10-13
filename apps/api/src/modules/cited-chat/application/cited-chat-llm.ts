// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  DocumentChatCloudUrlError,
  validateDocumentChatCloudBaseUrl,
} from '../../../shared/infrastructure/chat/document-chat-cloud-url-security.js';
import {
  type DocumentChatLlmRuntimeConfig,
  resolveDocumentChatCloudOverride,
} from '../../../shared/infrastructure/chat/document-chat-llm-config.js';
import { buildOllamaChatBody } from '../../../shared/infrastructure/chat/ollama-chat-options.js';
import {
  ollamaChatBaseUrl,
  ollamaChatConfigured,
  ollamaChatModel,
  ollamaChatTimeoutMs,
} from '../../../shared/infrastructure/chat/ollama-chat-request.js';
import { streamOllamaChat } from '../../../shared/infrastructure/chat/ollama-stream-chat.js';
import {
  postOpenAiCompatibleChat,
  streamOpenAiCompatibleChat,
} from '../../../shared/infrastructure/chat/openai-compatible-stream-chat.js';
import { isRecord } from '../../../shared/infrastructure/database/row-parse.js';

export function resolveCitedChatLlmConfig(input?: {
  cloudBaseUrl?: string | null;
  cloudApiKey?: string | null;
  cloudModel?: string | null;
}): DocumentChatLlmRuntimeConfig | null {
  const cloud = resolveDocumentChatCloudOverride({
    baseUrl: input?.cloudBaseUrl,
    apiKey: input?.cloudApiKey,
    model: input?.cloudModel,
  });
  if (cloud) {
    return cloud;
  }
  if (!ollamaChatConfigured()) {
    return null;
  }
  return {
    kind: 'ollama',
    model: ollamaChatModel(),
    baseUrl: ollamaChatBaseUrl(),
    apiKey: null,
  };
}

async function ensureOpenAiCompatibleBaseUrlSafe(
  config: DocumentChatLlmRuntimeConfig
): Promise<{ ok: true } | { ok: false; detail: string }> {
  if (config.kind !== 'openai_compatible') {
    return { ok: true };
  }
  try {
    await validateDocumentChatCloudBaseUrl(config.baseUrl);
    return { ok: true };
  } catch (err) {
    const code = err instanceof DocumentChatCloudUrlError ? err.code : 'document_chat_cloud_url_invalid';
    return { ok: false, detail: code };
  }
}

export async function streamDocumentChatLlm(params: {
  config: DocumentChatLlmRuntimeConfig;
  messages: { role: string; content: string }[];
  onToken: (token: string, fullText: string) => void | Promise<void>;
  shouldAbort: () => boolean | Promise<boolean>;
  responseFormat?: Record<string, unknown>;
}): Promise<{ content: string } | { failure: { kind: string; detail?: string } }> {
  if (params.config.kind === 'openai_compatible') {
    const safe = await ensureOpenAiCompatibleBaseUrlSafe(params.config);
    if (!safe.ok) {
      return { failure: { kind: 'network_error', detail: safe.detail } };
    }
    const result = await streamOpenAiCompatibleChat({
      config: params.config,
      messages: params.messages,
      onToken: params.onToken,
      shouldAbort: params.shouldAbort,
      responseFormat: params.responseFormat,
    });
    if ('failure' in result) {
      const detail =
        result.failure.kind === 'http_error'
          ? `HTTP ${String(result.failure.status)}`
          : result.failure.kind === 'network_error'
            ? result.failure.detail
            : undefined;
      return { failure: { kind: result.failure.kind, detail } };
    }
    return { content: result.content };
  }

  const streamResult = await streamOllamaChat({
    messages: params.messages,
    extraBody: params.responseFormat
      ? { format: params.responseFormat, think: false }
      : { think: false },
    onToken: params.onToken,
    shouldAbort: params.shouldAbort,
  });
  if ('failure' in streamResult) {
    return { failure: { kind: streamResult.failure.kind } };
  }
  return { content: streamResult.content };
}

export async function postDocumentChatLlm(
  config: DocumentChatLlmRuntimeConfig,
  messages: { role: string; content: string }[],
  responseFormat?: Record<string, unknown>
): Promise<{ ok: true; content: string } | { ok: false; detail: string }> {
  if (config.kind === 'openai_compatible') {
    const safe = await ensureOpenAiCompatibleBaseUrlSafe(config);
    if (!safe.ok) {
      return { ok: false, detail: safe.detail };
    }
    try {
      const response = await postOpenAiCompatibleChat(config, messages, responseFormat);
      if (!response.ok) {
        return { ok: false, detail: `HTTP ${String(response.status)}` };
      }
      const data: unknown = await response.json();
      if (!isRecord(data)) {
        return { ok: false, detail: 'invalid response' };
      }
      const choices = data.choices;
      if (!Array.isArray(choices) || choices.length === 0 || !isRecord(choices[0])) {
        return { ok: false, detail: 'empty model response' };
      }
      const message = choices[0].message;
      const content =
        isRecord(message) && typeof message.content === 'string' ? message.content.trim() : '';
      if (!content) {
        return { ok: false, detail: 'empty model response' };
      }
      return { ok: true, content };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : String(err) };
    }
  }

  const body = {
    ...buildOllamaChatBody(config.model, messages, false),
    ...(responseFormat ? { format: responseFormat, think: false } : { think: false }),
  };
  try {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(ollamaChatTimeoutMs()),
    });
    if (!response.ok) {
      return { ok: false, detail: `HTTP ${String(response.status)}` };
    }
    const data: unknown = await response.json();
    const messageContent =
      isRecord(data) && isRecord(data.message) && typeof data.message.content === 'string'
        ? data.message.content
        : '';
    const raw = messageContent.trim();
    if (!raw) {
      return { ok: false, detail: 'empty model response' };
    }
    return { ok: true, content: raw };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
