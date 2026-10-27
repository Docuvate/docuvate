// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { EXTRACTION_TIMEOUT_FAILURE_MESSAGE } from '../../extraction/domain/extraction-queue-failures.js';
import { StaleDocumentExtractionReconcileService } from './stale-document-extraction-reconcile.service.js';

describe('StaleDocumentExtractionReconcileService', () => {
  const previousTimeoutMs = process.env['WORKER_EXTRACT_TIMEOUT_MS'];
  const previousTimeoutSeconds = process.env['DOCUVATE_EXTRACT_TIMEOUT_SECONDS'];

  afterEach(() => {
    if (previousTimeoutMs === undefined) {
      delete process.env['WORKER_EXTRACT_TIMEOUT_MS'];
    } else {
      process.env['WORKER_EXTRACT_TIMEOUT_MS'] = previousTimeoutMs;
    }
    if (previousTimeoutSeconds === undefined) {
      delete process.env['DOCUVATE_EXTRACT_TIMEOUT_SECONDS'];
    } else {
      process.env['DOCUVATE_EXTRACT_TIMEOUT_SECONDS'] = previousTimeoutSeconds;
    }
  });

  it('fails queued and extracting documents older than the extract deadline', async () => {
    process.env['WORKER_EXTRACT_TIMEOUT_MS'] = '240000';
    type QueryFn = (
      sql: string,
      values?: unknown[]
    ) => Promise<{ rowCount: number | null; rows: { id: string }[] }>;
    const query = vi.fn<QueryFn>().mockResolvedValue({
      rowCount: 2,
      rows: [{ id: 'a' }, { id: 'b' }],
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        StaleDocumentExtractionReconcileService,
        { provide: PG_POOL, useValue: { query } },
      ],
    }).compile();
    const service = moduleRef.get(StaleDocumentExtractionReconcileService);

    const count = await service.reconcileOnce();

    expect(count).toBe(2);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("status IN ('queued', 'extracting')"),
      [EXTRACTION_TIMEOUT_FAILURE_MESSAGE, 240]
    );
  });
});
