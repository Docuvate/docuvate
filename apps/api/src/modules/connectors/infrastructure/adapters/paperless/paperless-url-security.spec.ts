// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lookup } from 'node:dns/promises';
import {
  normalizePaperlessBaseUrl,
  assertPaperlessHostResolvable,
  paperlessSafeFetch,
} from './paperless-url-security.js';

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(),
}));

describe('paperless-url-security', () => {
  beforeEach(() => {
    vi.mocked(lookup).mockReset();
    delete process.env.DV_CONNECTOR_ALLOW_PRIVATE_NETWORKS;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects non-http schemes', () => {
    expect(() => normalizePaperlessBaseUrl('ftp://example.com')).toThrow(
      'connectors.paperless.errors.urlScheme'
    );
  });

  it('rejects userinfo in URL', () => {
    expect(() => normalizePaperlessBaseUrl('http://user:pass@example.com')).toThrow(
      'connectors.paperless.errors.urlUserinfo'
    );
  });

  it('rejects query and fragment', () => {
    expect(() => normalizePaperlessBaseUrl('http://example.com/?q=1')).toThrow(
      'connectors.paperless.errors.urlQueryFragment'
    );
    expect(() => normalizePaperlessBaseUrl('http://example.com/#frag')).toThrow(
      'connectors.paperless.errors.urlQueryFragment'
    );
  });

  it('blocks metadata IPs', async () => {
    vi.mocked(lookup).mockResolvedValue([{ address: '169.254.169.254', family: 4 }] as never);
    await expect(assertPaperlessHostResolvable('http://metadata.example')).rejects.toThrow(
      'connectors.paperless.errors.urlMetadataBlocked'
    );
  });

  it('blocks private IPs when flag is off', async () => {
    process.env.DV_CONNECTOR_ALLOW_PRIVATE_NETWORKS = '0';
    vi.mocked(lookup).mockResolvedValue([{ address: '10.0.0.5', family: 4 }] as never);
    await expect(assertPaperlessHostResolvable('http://paperless.local')).rejects.toThrow(
      'connectors.paperless.errors.urlPrivateBlocked'
    );
  });

  it('allows private IPs by default', async () => {
    vi.mocked(lookup).mockResolvedValue([{ address: '10.0.0.5', family: 4 }] as never);
    await expect(assertPaperlessHostResolvable('http://paperless.local')).resolves.toBeUndefined();
  });

  it('rejects redirect to blocked host', async () => {
    vi.mocked(lookup).mockImplementation(async (host) => {
      if (host === 'public.example') {
        return [{ address: '8.8.8.8', family: 4 }] as never;
      }
      return [{ address: '169.254.1.1', family: 4 }] as never;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 302,
        headers: { get: () => 'http://metadata.internal/api/' },
      })
    );
    await expect(
      paperlessSafeFetch('http://public.example', '/api/token/', { method: 'GET' })
    ).rejects.toThrow('connectors.paperless.errors.urlMetadataBlocked');
  });

  it('blocks hostname resolving to metadata address', async () => {
    vi.mocked(lookup).mockResolvedValue([{ address: '169.254.170.2', family: 4 }] as never);
    await expect(assertPaperlessHostResolvable('http://evil.example')).rejects.toThrow(
      'connectors.paperless.errors.urlMetadataBlocked'
    );
  });
});
