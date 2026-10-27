// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { EXTRACTION_TIMEOUT_FAILURE_MESSAGE } from '../../extraction/domain/extraction-queue-failures.js';
import type { ExtractionReconcileJob } from '../../extraction/domain/plan-extraction-reconcile.js';
import { ExtractionQueueService } from '../../extraction/infrastructure/extraction-queue.service.js';
import {
  type ExtractionReconcileStore,
  StaleDocumentExtractionReconcileService,
} from './stale-document-extraction-reconcile.service.js';

type QueryFn = (
  sql: string,
  values?: unknown[]
) => Promise<{ rowCount: number | null; rows: Record<string, unknown>[] }>;

async function buildService(deps: {
  query: ReturnType<typeof vi.fn<QueryFn>>;
  inspect: ReturnType<typeof vi.fn<(documentId: string) => Promise<ExtractionReconcileJob>>>;
  ensureQueued: ReturnType<typeof vi.fn<(documentId: string, userId: string) => Promise<void>>>;
}): Promise<StaleDocumentExtractionReconcileService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: StaleDocumentExtractionReconcileService,
        useFactory: (pool: ExtractionReconcileStore, queue: ExtractionQueueService) =>
          new StaleDocumentExtractionReconcileService(pool, queue),
        inject: [PG_POOL, ExtractionQueueService],
      },
      { provide: PG_POOL, useValue: { query: deps.query } },
      {
        provide: ExtractionQueueService,
        useValue: {
          isReady: () => true,
          inspectExtractionJob: deps.inspect,
          ensureQueued: deps.ensureQueued,
        },
      },
    ],
  }).compile();
  return moduleRef.get(StaleDocumentExtractionReconcileService);
}

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

  it('skips a headless queue stub that has no isReady', async () => {
    const query = vi.fn<QueryFn>();
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: StaleDocumentExtractionReconcileService,
          useFactory: (pool: ExtractionReconcileStore, queue: ExtractionQueueService) =>
            new StaleDocumentExtractionReconcileService(pool, queue),
          inject: [PG_POOL, ExtractionQueueService],
        },
        { provide: PG_POOL, useValue: { query } },
        { provide: ExtractionQueueService, useValue: { enqueue: () => Promise.resolve() } },
      ],
    }).compile();
    const service = moduleRef.get(StaleDocumentExtractionReconcileService);

    await expect(service.reconcileOnce()).resolves.toEqual({ failed: 0, enqueued: 0 });
    expect(query).not.toHaveBeenCalled();
  });

  it('skips when the extraction queue is not ready', async () => {
    const query = vi.fn<QueryFn>();
    const inspect = vi.fn<(documentId: string) => Promise<ExtractionReconcileJob>>();
    const ensureQueued = vi.fn<(documentId: string, userId: string) => Promise<void>>();
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: StaleDocumentExtractionReconcileService,
          useFactory: (pool: ExtractionReconcileStore, queue: ExtractionQueueService) =>
            new StaleDocumentExtractionReconcileService(pool, queue),
          inject: [PG_POOL, ExtractionQueueService],
        },
        { provide: PG_POOL, useValue: { query } },
        {
          provide: ExtractionQueueService,
          useValue: {
            isReady: () => false,
            inspectExtractionJob: inspect,
            ensureQueued,
          },
        },
      ],
    }).compile();
    const service = moduleRef.get(StaleDocumentExtractionReconcileService);

    await expect(service.reconcileOnce()).resolves.toEqual({ failed: 0, enqueued: 0 });
    expect(query).not.toHaveBeenCalled();
    expect(inspect).not.toHaveBeenCalled();
  });

  it('leaves a long queued backlog untouched', async () => {
    const query = vi.fn<QueryFn>().mockResolvedValue({
      rowCount: 2,
      rows: [
        { id: 'q1', user_id: 'u1', status: 'queued' },
        { id: 'q2', user_id: 'u1', status: 'queued' },
      ],
    });
    const inspect = vi.fn<(documentId: string) => Promise<ExtractionReconcileJob>>().mockResolvedValue({
      live: true,
      startedAtMs: null,
    });
    const ensureQueued = vi.fn<(documentId: string, userId: string) => Promise<void>>();
    const service = await buildService({ query, inspect, ensureQueued });

    const result = await service.reconcileOnce();

    expect(result).toEqual({ failed: 0, enqueued: 0 });
    expect(ensureQueued).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain('queued');
    expect(query.mock.calls[0][0]).not.toContain('failed');
  });

  it('re-enqueues orphaned queued documents', async () => {
    const query = vi.fn<QueryFn>().mockResolvedValue({
      rowCount: 1,
      rows: [{ id: 'orphan', user_id: 'u2', status: 'queued' }],
    });
    const inspect = vi.fn<(documentId: string) => Promise<ExtractionReconcileJob>>().mockResolvedValue({
      live: false,
      startedAtMs: null,
    });
    const ensureQueued = vi.fn<(documentId: string, userId: string) => Promise<void>>().mockResolvedValue();
    const service = await buildService({ query, inspect, ensureQueued });

    const result = await service.reconcileOnce();

    expect(result).toEqual({ failed: 0, enqueued: 1 });
    expect(ensureQueued).toHaveBeenCalledWith('orphan', 'u2');
    expect(query.mock.calls.some((call) => call[0].includes('UPDATE'))).toBe(false);
  });

  it('fails stuck extracting past the lease deadline with the i18n timeout reason', async () => {
    process.env['WORKER_EXTRACT_TIMEOUT_MS'] = '240000';
    const query = vi.fn<QueryFn>().mockImplementation((sql) => {
      if (sql.includes('UPDATE')) {
        return Promise.resolve({ rowCount: 1, rows: [{ id: 'stuck' }] });
      }
      return Promise.resolve({
        rowCount: 1,
        rows: [{ id: 'stuck', user_id: 'u3', status: 'extracting' }],
      });
    });
    const inspect = vi.fn<(documentId: string) => Promise<ExtractionReconcileJob>>().mockResolvedValue({
      live: false,
      startedAtMs: Date.now() - 241_000,
    });
    const ensureQueued = vi.fn<(documentId: string, userId: string) => Promise<void>>();
    const service = await buildService({ query, inspect, ensureQueued });

    const result = await service.reconcileOnce();

    expect(result).toEqual({ failed: 1, enqueued: 0 });
    expect(ensureQueued).not.toHaveBeenCalled();
    const updateCall = query.mock.calls.find((call) => call[0].includes('UPDATE'));
    expect(updateCall).toBeDefined();
    expect(updateCall?.[1]).toEqual([EXTRACTION_TIMEOUT_FAILURE_MESSAGE, 'stuck']);
  });

  it('leaves an extracting document with an active job untouched', async () => {
    process.env['WORKER_EXTRACT_TIMEOUT_MS'] = '240000';
    const query = vi.fn<QueryFn>().mockResolvedValue({
      rowCount: 1,
      rows: [{ id: 'active', user_id: 'u4', status: 'extracting' }],
    });
    const inspect = vi.fn<(documentId: string) => Promise<ExtractionReconcileJob>>().mockResolvedValue({
      live: true,
      startedAtMs: Date.now() - 24 * 60 * 60 * 1000,
    });
    const ensureQueued = vi.fn<(documentId: string, userId: string) => Promise<void>>();
    const service = await buildService({ query, inspect, ensureQueued });

    const result = await service.reconcileOnce();

    expect(result).toEqual({ failed: 0, enqueued: 0 });
    expect(ensureQueued).not.toHaveBeenCalled();
    expect(query.mock.calls.some((call) => call[0].includes('UPDATE'))).toBe(false);
  });
});
