// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DocumentChatLlmRuntimeConfig } from './document-chat-llm-config.js';
import {
  postOpenAiCompatibleChat,
  streamOpenAiCompatibleChat,
} from './openai-compatible-stream-chat.js';

const config: DocumentChatLlmRuntimeConfig = {
  kind: 'openai_compatible',
  model: 'test',
  baseUrl: 'https://api.example.com',
  apiKey: 'sk-test',
};

describe('openai-compatible-stream-chat SSRF', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects HTTP redirects in streamOpenAiCompatibleChat', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.redirect).toBe('error');
      return new Response('', {
        status: 302,
        headers: { Location: 'http://127.0.0.1/internal' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await streamOpenAiCompatibleChat({
      config,
      messages: [{ role: 'user', content: 'hi' }],
      onToken: () => undefined,
      shouldAbort: () => false,
    });

    expect('failure' in result).toBe(true);
    if ('failure' in result) {
      expect(result.failure).toEqual({
        kind: 'network_error',
        detail: 'redirect_not_allowed',
      });
    }
  });

  it('uses redirect error mode in postOpenAiCompatibleChat', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.redirect).toBe('error');
      return new Response('{}', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await postOpenAiCompatibleChat(config, [{ role: 'user', content: 'hi' }]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
