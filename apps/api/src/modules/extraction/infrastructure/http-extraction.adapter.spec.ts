// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExtractionFailure } from '../domain/extraction-failure.js';
import { HttpExtractionAdapter } from './http-extraction.adapter.js';
import { WorkerExtractCapacityCoordinator } from './worker-extract-capacity.coordinator.js';

async function extractFailure(adapter: HttpExtractionAdapter): Promise<ExtractionFailure> {
  try {
    await adapter.extract(Buffer.from('x'), 'application/pdf');
  } catch (error: unknown) {
    if (error instanceof ExtractionFailure) {
      return error;
    }
    throw error;
  }
  throw new Error('expected extract to fail');
}

describe('HttpExtractionAdapter.extract', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('maps the API-side fetch deadline to a permanent worker_timeout', async () => {
    vi.stubEnv('DOCUMENT_EXTRACTION_WORKER_TIMEOUT_MS', '5');
    const fetchMock = vi.fn<typeof fetch>((_url, init) => {
      const signal = init?.signal;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new Error('aborted'));
        });
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new HttpExtractionAdapter(new WorkerExtractCapacityCoordinator());

    const failure = await extractFailure(adapter);
    expect(failure.code).toBe('worker_timeout');
    expect(failure.retryable).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('makes a single attempt on network failure; BullMQ owns retries', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new HttpExtractionAdapter(new WorkerExtractCapacityCoordinator());

    const failure = await extractFailure(adapter);
    expect(failure.code).toBe('worker_unreachable');
    expect(failure.retryable).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeDefined();
  });

  it('makes a single attempt on a worker deadline 503 and carries the typed code', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: {
            errorCode: 'extract_deadline_exceeded',
            errorType: 'ExtractDeadlineExceeded',
            reason: 'extract deadline exceeded',
          },
        }),
        { status: 503 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new HttpExtractionAdapter(new WorkerExtractCapacityCoordinator());

    const failure = await extractFailure(adapter);
    expect(failure.code).toBe('worker_deadline');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps a worker 422 resource exhaustion to a permanent typed failure', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: {
            errorCode: 'extract_permanent_failure',
            errorType: 'ExtractResourceExhausted',
            reason: 'too large',
          },
        }),
        { status: 422 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new HttpExtractionAdapter(new WorkerExtractCapacityCoordinator());

    const failure = await extractFailure(adapter);
    expect(failure.code).toBe('resource_exhausted');
    expect(failure.retryable).toBe(false);
  });
});
