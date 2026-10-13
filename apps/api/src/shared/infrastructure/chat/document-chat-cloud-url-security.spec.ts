// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { lookup } from 'node:dns/promises';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockDnsLookupAll } from '../../../test-support/dns-lookup.spec-util.js';
import {
  assertDocumentChatCloudHostResolvable,
  normalizeDocumentChatCloudBaseUrl,
  openAiCompatibleChatCompletionsUrl,
} from './document-chat-cloud-url-security.js';

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(),
}));

describe('document-chat-cloud-url-security', () => {
  beforeEach(() => {
    vi.mocked(lookup).mockReset();
    delete process.env['DOCUMENT_CHAT_CLOUD_ALLOW_HTTP'];
    delete process.env['DOCUMENT_CHAT_CLOUD_ALLOWED_HOSTS'];
  });

  it('normalizes https base URLs and rejects http by default', () => {
    expect(normalizeDocumentChatCloudBaseUrl('https://api.example.com/v1/')).toBe(
      'https://api.example.com/v1'
    );
    expect(() => normalizeDocumentChatCloudBaseUrl('http://api.example.com')).toThrow(
      'document_chat_cloud_url_scheme'
    );
  });

  it('allows http when admin env switch is set', () => {
    process.env['DOCUMENT_CHAT_CLOUD_ALLOW_HTTP'] = 'true';
    expect(normalizeDocumentChatCloudBaseUrl('http://api.example.com')).toBe(
      'http://api.example.com'
    );
  });

  it('builds chat completions URL without double /v1', () => {
    expect(openAiCompatibleChatCompletionsUrl('https://api.example.com')).toBe(
      'https://api.example.com/v1/chat/completions'
    );
    expect(openAiCompatibleChatCompletionsUrl('https://api.example.com/v1')).toBe(
      'https://api.example.com/v1/chat/completions'
    );
  });

  it('blocks private resolved addresses unless host is allowlisted', async () => {
    mockDnsLookupAll([{ address: '10.0.0.5', family: 4 }]);
    await expect(
      assertDocumentChatCloudHostResolvable('https://internal.example.com')
    ).rejects.toThrow('document_chat_cloud_url_private_blocked');

    process.env['DOCUMENT_CHAT_CLOUD_ALLOWED_HOSTS'] = 'internal.example.com';
    await expect(
      assertDocumentChatCloudHostResolvable('https://internal.example.com')
    ).resolves.toBeUndefined();
  });
});
