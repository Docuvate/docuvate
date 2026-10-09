// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { resolveEffectiveDocumentChatProvider } from './resolve-effective-document-chat-provider.js';

describe('resolveEffectiveDocumentChatProvider', () => {
  const providers = [
    { id: 'context', available: true },
    { id: 'donut-ml', available: false },
    { id: 'ollama', available: false },
    { id: 'mock', available: true },
  ];

  it('returns preferred when available', () => {
    expect(resolveEffectiveDocumentChatProvider('context', providers)).toBe('context');
  });

  it('falls back from unavailable donut to context when no LLM path', () => {
    expect(resolveEffectiveDocumentChatProvider('donut-ml', providers)).toBe('context');
  });

  it('falls back from unavailable donut to rag-ollama when available', () => {
    expect(
      resolveEffectiveDocumentChatProvider('donut-ml', [
        { id: 'context', available: true },
        { id: 'donut-ml', available: false },
        { id: 'rag-ollama', available: true },
        { id: 'ollama', available: true },
        { id: 'mock', available: true },
      ])
    ).toBe('rag-ollama');
  });

  it('returns off when nothing is available', () => {
    expect(
      resolveEffectiveDocumentChatProvider('donut-ml', [
        { id: 'context', available: false },
        { id: 'donut-ml', available: false },
        { id: 'mock', available: false },
      ])
    ).toBe('off');
  });
});
