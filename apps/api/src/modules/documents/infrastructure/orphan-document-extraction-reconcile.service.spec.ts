// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import { OrphanDocumentExtractionReconcileService } from './orphan-document-extraction-reconcile.service.js';

describe('OrphanDocumentExtractionReconcileService', () => {
  it('re-enqueues queued documents without a BullMQ job', async () => {
    const pool = {
      query: vi.fn(() =>
        Promise.resolve({
          rows: [{ id: 'doc-1', user_id: 'user-1' }],
        })
      ),
    };
    const extractionQueue = {
      isJobQueuedOrActive: vi.fn(() => Promise.resolve(false)),
      enqueue: vi.fn(() => Promise.resolve()),
    };
    const service = new OrphanDocumentExtractionReconcileService(
      // @ts-expect-error partial pg.Pool stub for unit test
      pool,
      // @ts-expect-error partial ExtractionQueueService stub for unit test
      extractionQueue
    );

    const count = await service.reconcileOnce();

    expect(count).toBe(1);
    expect(extractionQueue.enqueue).toHaveBeenCalledWith('doc-1', 'user-1');
  });

  it('skips documents that already have an active queue job', async () => {
    const pool = {
      query: vi.fn(() =>
        Promise.resolve({
          rows: [{ id: 'doc-1', user_id: 'user-1' }],
        })
      ),
    };
    const extractionQueue = {
      isJobQueuedOrActive: vi.fn(() => Promise.resolve(true)),
      enqueue: vi.fn(),
    };
    const service = new OrphanDocumentExtractionReconcileService(
      // @ts-expect-error partial pg.Pool stub for unit test
      pool,
      // @ts-expect-error partial ExtractionQueueService stub for unit test
      extractionQueue
    );

    const count = await service.reconcileOnce();

    expect(count).toBe(0);
    expect(extractionQueue.enqueue).not.toHaveBeenCalled();
  });
});
