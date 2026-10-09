// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lookup } from 'node:dns/promises';
import {
  PaperlessApiClient,
  detectPaperlessApiVersion,
  paperlessApiFetch,
} from './paperless-api.client.js';

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(),
}));

const baseCredentials = {
  base_url: 'https://paperless.test',
  api_token: 'secret-token',
};

describe('paperless API client (mocked)', () => {
  beforeEach(() => {
    vi.mocked(lookup).mockResolvedValue([{ address: '8.8.8.8', family: 4 }] as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects API version 3 from Accept header flow', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const headers = new Headers(init?.headers);
      const accept = headers.get('Accept');
      if (accept === 'application/json; version=3') {
        return new Response(JSON.stringify({ count: 0, results: [] }), { status: 200 });
      }
      return new Response('', { status: 406 });
    });
    await expect(detectPaperlessApiVersion(baseCredentials)).resolves.toBe(3);
  });

  it('lists documents with pagination metadata', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 42,
              title: 'Invoice',
              content: 'ocr text',
              created: '2024-01-01T00:00:00Z',
              modified: '2024-01-02T00:00:00Z',
              added: '2024-01-01T00:00:00Z',
              archive_serial_number: 7,
              original_file_name: 'invoice.pdf',
              mime_type: 'application/pdf',
              checksum: 'abc',
              correspondent: 1,
              document_type: 2,
              storage_path: 3,
              tags: [4],
              custom_fields: [],
            },
          ],
        }),
        { status: 200 }
      )
    );
    const client = new PaperlessApiClient(baseCredentials, 3);
    const page = await client.listDocuments({ page: 1, pageSize: 50 });
    expect(page.results[0]?.title).toBe('Invoice');
    expect(page.count).toBe(1);
  });

  it('retries transient 503 responses from paperlessApiFetch', async () => {
    let calls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      calls += 1;
      if (calls < 3) {
        return new Response('', { status: 503 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const response = await paperlessApiFetch(baseCredentials, '/api/status/', {}, 3);
    expect(response.ok).toBe(true);
    expect(calls).toBeGreaterThanOrEqual(3);
  });
});
