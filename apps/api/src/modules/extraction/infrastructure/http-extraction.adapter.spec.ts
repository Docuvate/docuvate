// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EXTRACTION_TIMEOUT_FAILURE_MESSAGE } from '../domain/extraction-queue-failures.js';
import { HttpExtractionAdapter } from './http-extraction.adapter.js';

describe('HttpExtractionAdapter.extract deadline', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not retry when the worker /extract fetch hits the extract deadline', async () => {
    const timeout = new Error('The operation was aborted due to timeout');
    timeout.name = 'TimeoutError';
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(timeout);
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new HttpExtractionAdapter();

    await expect(adapter.extract(Buffer.from('x'), 'application/pdf')).rejects.toThrow(
      EXTRACTION_TIMEOUT_FAILURE_MESSAGE
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeDefined();
  });
});
