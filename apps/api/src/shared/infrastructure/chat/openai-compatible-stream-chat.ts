// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { isRecord, parseString } from '../database/row-parse.js';
import { openAiCompatibleChatCompletionsUrl } from './document-chat-cloud-url-security.js';
import type { DocumentChatLlmRuntimeConfig } from './document-chat-llm-config.js';
import { ollamaChatIdleTimeoutMs } from './ollama-chat-options.js';

export type OpenAiStreamFailure =
  | { kind: 'idle_timeout' }
  | { kind: 'aborted' }
  | { kind: 'http_error'; status: number; detail?: string }
  | { kind: 'network_error'; detail: string };

export interface StreamOpenAiCompatibleChatParams {
  config: DocumentChatLlmRuntimeConfig;
  messages: { role: string; content: string }[];
  onToken: (token: string, fullText: string) => void | Promise<void>;
  shouldAbort: () => boolean | Promise<boolean>;
  idleTimeoutMs?: number;
  responseFormat?: Record<string, unknown>;
}

export async function streamOpenAiCompatibleChat(
  params: StreamOpenAiCompatibleChatParams
): Promise<{ content: string } | { failure: OpenAiStreamFailure }> {
  const idleTimeoutMs = params.idleTimeoutMs ?? ollamaChatIdleTimeoutMs();
  const url = openAiCompatibleChatCompletionsUrl(params.config.baseUrl);
  const body: Record<string, unknown> = {
    model: params.config.model,
    messages: params.messages,
    stream: true,
    temperature: 0.1,
  };
  if (params.responseFormat) {
    body.response_format = { type: 'json_schema', json_schema: params.responseFormat };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      redirect: 'error',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.config.apiKey ?? ''}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      failure: {
        kind: 'network_error',
        detail: err instanceof Error ? err.message : String(err),
      },
    };
  }

  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel().catch(() => undefined);
    return { failure: { kind: 'network_error', detail: 'redirect_not_allowed' } };
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    return { failure: { kind: 'http_error', status: response.status } };
  }
  if (!response.body) {
    return { failure: { kind: 'network_error', detail: 'empty response body' } };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let lastTokenAt = Date.now();

  const checkAbortAndIdle = async (): Promise<OpenAiStreamFailure | null> => {
    if (await params.shouldAbort()) {
      return { kind: 'aborted' };
    }
    if (Date.now() - lastTokenAt > idleTimeoutMs) {
      return { kind: 'idle_timeout' };
    }
    return null;
  };

  try {
    for (;;) {
      const abortReason = await checkAbortAndIdle();
      if (abortReason) {
        await reader.cancel().catch(() => undefined);
        return { failure: abortReason };
      }

      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) {
          continue;
        }
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          continue;
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }
        if (!isRecord(parsed)) {
          continue;
        }
        const choices = parsed.choices;
        if (!Array.isArray(choices) || choices.length === 0) {
          continue;
        }
        const choiceUnknown: unknown = choices[0];
        if (!isRecord(choiceUnknown)) {
          continue;
        }
        const delta = choiceUnknown.delta;
        if (!isRecord(delta)) {
          continue;
        }
        const token = parseString(delta.content);
        if (!token) {
          continue;
        }
        fullText += token;
        lastTokenAt = Date.now();
        await params.onToken(token, fullText);
      }
    }
    return { content: fullText };
  } catch (err) {
    return {
      failure: {
        kind: 'network_error',
        detail: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

export async function postOpenAiCompatibleChat(
  config: DocumentChatLlmRuntimeConfig,
  messages: { role: string; content: string }[],
  responseFormat?: Record<string, unknown>
): Promise<Response> {
  const url = openAiCompatibleChatCompletionsUrl(config.baseUrl);
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    stream: false,
    temperature: 0.1,
  };
  if (responseFormat) {
    body.response_format = { type: 'json_schema', json_schema: responseFormat };
  }
  return fetch(url, {
    method: 'POST',
    redirect: 'error',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey ?? ''}`,
    },
    body: JSON.stringify(body),
  });
}
