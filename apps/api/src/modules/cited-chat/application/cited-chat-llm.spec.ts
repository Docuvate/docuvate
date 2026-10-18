// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveCitedChatLlmConfig } from './cited-chat-llm.js';

describe('resolveCitedChatLlmConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('skips Ollama when allowLocalOllama is false', () => {
    vi.stubEnv('OLLAMA_URL', 'http://ollama:11434');
    expect(
      resolveCitedChatLlmConfig({
        allowLocalOllama: false,
      })
    ).toBeNull();
  });

  it('uses Ollama when allowLocalOllama is true and OLLAMA_URL is set', () => {
    vi.stubEnv('OLLAMA_URL', 'http://ollama:11434');
    vi.stubEnv('OLLAMA_MODEL', 'qwen2.5:1.5b');
    const config = resolveCitedChatLlmConfig({
      allowLocalOllama: true,
    });
    expect(config?.kind).toBe('ollama');
    if (config?.kind === 'ollama') {
      expect(config.model).toBe('qwen2.5:1.5b');
    }
  });
});
