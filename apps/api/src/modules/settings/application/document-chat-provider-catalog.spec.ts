// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildDocumentChatProvidersCatalog } from './document-chat-provider-catalog.js';

describe('buildDocumentChatProvidersCatalog', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exposes only available rag-ollama in selectable when configured', () => {
    vi.stubEnv('WORKER_URL', 'http://worker:8000');
    vi.stubEnv('OLLAMA_URL', 'http://ollama:11434');
    vi.stubEnv('OLLAMA_MODEL', 'qwen2.5:3b');
    vi.stubEnv('NODE_ENV', 'production');

    const catalog = buildDocumentChatProvidersCatalog({
      workerProviders: null,
      hardware: {
        device: 'cpu',
        vramMb: 0,
        gpuAvailable: false,
        capabilities: { heavyVision: false, largeLocalLlm: false, cpuRag: true },
      },
      ollamaModelReady: true,
    });

    expect(catalog.selectable.map((p) => p.id)).toEqual(['rag-ollama']);
    expect(catalog.unavailable.some((u) => u.id === 'rag-ollama')).toBe(false);
    expect(catalog.development).toHaveLength(0);
    expect(catalog.meta.ollamaModel).toBe('qwen2.5:3b');
  });

  it('hides dev providers in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('WORKER_URL', 'http://worker:8000');
    vi.stubEnv('OLLAMA_URL', 'http://ollama:11434');

    const catalog = buildDocumentChatProvidersCatalog({
      workerProviders: null,
      hardware: null,
      ollamaModelReady: false,
    });
    expect(catalog.development).toHaveLength(0);
  });

  it('exposes rag-ollama when only worker is configured (extractive cited chat)', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('WORKER_URL', 'http://worker:8000');
    vi.stubEnv('OLLAMA_URL', '');

    const catalog = buildDocumentChatProvidersCatalog({
      workerProviders: null,
      hardware: null,
      ollamaModelReady: false,
    });

    expect(catalog.selectable.map((p) => p.id)).toEqual(['rag-ollama']);
    expect(catalog.meta.ollamaConfigured).toBe(false);
  });

  it('includes mock when NODE_ENV is development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('OLLAMA_URL', 'http://ollama:11434');

    const catalog = buildDocumentChatProvidersCatalog({
      workerProviders: null,
      hardware: null,
      ollamaModelReady: true,
    });
    expect(catalog.development.some((p) => p.id === 'mock')).toBe(true);
  });
});
