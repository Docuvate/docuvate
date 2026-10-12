// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import { resolveDocumentChatProvider } from './resolve-document-chat-provider.js';

describe('resolveDocumentChatProvider', () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('honors explicit user preference off even when a runtime provider is configured', () => {
    process.env['DOCUMENT_CHAT_PROVIDER'] = 'context';
    process.env['WORKER_URL'] = 'http://worker';
    expect(resolveDocumentChatProvider('off')).toBe('off');
  });
});
