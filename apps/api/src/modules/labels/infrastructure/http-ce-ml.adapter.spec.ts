// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpCeMlAdapter } from './http-ce-ml.adapter.js';

describe('HttpCeMlAdapter scoreMissingLabelHintsBatch', () => {
  const previousFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = previousFetch;
    vi.restoreAllMocks();
  });

  it('returns empty results when the worker route is missing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    const adapter = new HttpCeMlAdapter();
    await expect(
      adapter.scoreMissingLabelHintsBatch({
        targets: [{ targetDocumentIndex: 0, assignedTagIds: [] }],
        corpus: [],
        labeledDocumentIndices: [],
      })
    ).resolves.toEqual([]);
  });
});
