// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { resolveCustomerDocumentChatProvider } from './resolve-customer-document-chat-provider.js';

describe('resolveCustomerDocumentChatProvider', () => {
  const workerOnly = [
    { id: 'context', available: true },
    { id: 'donut-ml', available: false },
    { id: 'ollama', available: false },
  ];

  it('returns off when only context is available', () => {
    expect(resolveCustomerDocumentChatProvider('context', workerOnly)).toBe('off');
  });

  it('uses rag-ollama when preferred context but rag path is available', () => {
    expect(
      resolveCustomerDocumentChatProvider('context', [
        { id: 'context', available: true },
        { id: 'rag-ollama', available: true },
        { id: 'ollama', available: true },
        { id: 'donut-ml', available: false },
      ])
    ).toBe('rag-ollama');
  });

  it('uses donut when available and preferred', () => {
    expect(
      resolveCustomerDocumentChatProvider('donut-ml', [
        { id: 'donut-ml', available: true },
        { id: 'ollama', available: true },
      ])
    ).toBe('donut-ml');
  });

  it('falls back to rag-ollama when donut unavailable', () => {
    expect(
      resolveCustomerDocumentChatProvider('donut-ml', [
        { id: 'donut-ml', available: false },
        { id: 'rag-ollama', available: true },
        { id: 'ollama', available: true },
      ])
    ).toBe('rag-ollama');
  });

  it('maps preferred ollama to rag-ollama when available', () => {
    expect(
      resolveCustomerDocumentChatProvider('ollama', [
        { id: 'rag-ollama', available: true },
        { id: 'ollama', available: true },
      ])
    ).toBe('rag-ollama');
  });
});
