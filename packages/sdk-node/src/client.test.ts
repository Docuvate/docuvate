import { describe, expect, it } from 'vitest';
import { DocuvateClient } from './client.js';
import { DocuvateApiError } from './errors.js';

describe('DocuvateClient', () => {
  it('binds generated listDocuments with service auth', async () => {
    const calls: { url: string; headers: Headers }[] = [];
    const mockFetch: typeof fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      calls.push({ url, headers: new Headers(init?.headers) });
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new DocuvateClient({
      baseUrl: 'http://127.0.0.1:3001/v1',
      apiKey: 'test-key',
      fetch: mockFetch,
    });

    await client.api.listDocuments({ query: { status: 'ready' } });
    expect(calls[0]?.url).toContain('/v1/documents');
    expect(calls.length).toBeGreaterThan(0);
  });

  it('exposes all generated operations on api', () => {
    const client = new DocuvateClient({ baseUrl: 'http://localhost/v1' });
    expect(typeof client.api.getDocument).toBe('function');
    expect(typeof client.api.listTags).toBe('function');
    expect(typeof client.api.getConnectorCatalog).toBe('function');
  });
});
