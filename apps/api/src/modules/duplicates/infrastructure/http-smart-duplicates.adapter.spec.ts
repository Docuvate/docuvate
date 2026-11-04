// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { HttpSmartDuplicatesAdapter } from './http-smart-duplicates.adapter.js';

// Shared with apps/worker/tests/test_smart_duplicates_route.py so both sides
// of the API→worker contract are tested against the same payload.
const fixturePath = join(
  process.cwd(),
  '..',
  'worker',
  'tests',
  'fixtures',
  'smart_duplicates_detect_contract.v1.json'
);

const fixtureSchema = z.object({
  path: z.string(),
  request: z.object({
    focusDocumentId: z.string(),
    focusLines: z.array(z.string()),
    peers: z.array(z.object({ documentId: z.string(), lines: z.array(z.string()) })),
  }),
  expectedDocumentIds: z.array(z.string()),
});

describe('HttpSmartDuplicatesAdapter.detectCandidates', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('posts the shared contract payload to the worker detect route', async () => {
    const fixture = fixtureSchema.parse(JSON.parse(readFileSync(fixturePath, 'utf8')));
    vi.stubEnv('WORKER_URL', 'http://worker.test');
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        candidates: fixture.expectedDocumentIds.map((documentId) => ({
          documentId,
          similarity: 0.9,
        })),
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const hits = await new HttpSmartDuplicatesAdapter().detectCandidates(
      fixture.request.focusDocumentId,
      fixture.request.focusLines,
      fixture.request.peers
    );

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`http://worker.test/v1${fixture.path}`);
    const body = init?.body;
    expect(typeof body).toBe('string');
    expect(JSON.parse(typeof body === 'string' ? body : '')).toEqual(fixture.request);
    expect(hits.map((hit) => hit.documentId)).toEqual(fixture.expectedDocumentIds);
  });
});
