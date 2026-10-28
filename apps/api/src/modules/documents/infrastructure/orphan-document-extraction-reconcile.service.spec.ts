// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { createDocumentExtractionEnqueueStub } from '../../../test-support/document-extraction-enqueue.stub.js';
import { createOrphanReconcileDbStub } from '../../../test-support/orphan-reconcile-db.stub.js';
import { DOCUMENT_EXTRACTION_ENQUEUE } from '../domain/document-extraction-enqueue.token.js';
import type { OrphanReconcileDbPort } from '../domain/orphan-reconcile-db.port.js';
import { OrphanDocumentExtractionReconcileService } from './orphan-document-extraction-reconcile.service.js';

describe('OrphanDocumentExtractionReconcileService', () => {
  it('re-enqueues queued documents without a BullMQ job', async () => {
    const pool = createOrphanReconcileDbStub({
      query: vi.fn(() =>
        Promise.resolve({
          rows: [{ id: 'doc-1', user_id: 'user-1' }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: [],
        })
      ),
    });
    const enqueue = vi.fn(() => Promise.resolve());
    const extractionQueue = createDocumentExtractionEnqueueStub({
      isJobQueuedOrActive: vi.fn(() => Promise.resolve(false)),
      enqueue,
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrphanDocumentExtractionReconcileService,
        { provide: PG_POOL, useValue: pool },
        { provide: DOCUMENT_EXTRACTION_ENQUEUE, useValue: extractionQueue },
      ],
    }).compile();
    const service = moduleRef.get(OrphanDocumentExtractionReconcileService);

    const count = await service.reconcileOnce();

    expect(count).toBe(1);
    expect(enqueue).toHaveBeenCalledWith('doc-1', 'user-1');
  });

  it('skips documents that already have an active queue job', async () => {
    const pool = createOrphanReconcileDbStub({
      query: vi.fn(() =>
        Promise.resolve({
          rows: [{ id: 'doc-1', user_id: 'user-1' }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: [],
        })
      ),
    });
    const enqueue = vi.fn(() => Promise.resolve());
    const extractionQueue = createDocumentExtractionEnqueueStub({
      isJobQueuedOrActive: vi.fn(() => Promise.resolve(true)),
      enqueue,
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrphanDocumentExtractionReconcileService,
        { provide: PG_POOL, useValue: pool },
        { provide: DOCUMENT_EXTRACTION_ENQUEUE, useValue: extractionQueue },
      ],
    }).compile();
    const service = moduleRef.get(OrphanDocumentExtractionReconcileService);

    const count = await service.reconcileOnce();

    expect(count).toBe(0);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('marks a document failed once the orphan re-enqueue bound is exceeded', async () => {
    const query = vi.fn<OrphanReconcileDbPort['query']>(() =>
      Promise.resolve({
        rows: [{ id: 'doc-1', user_id: 'user-1' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      })
    );
    const pool = createOrphanReconcileDbStub({ query });
    const enqueue = vi.fn(() => Promise.resolve());
    const extractionQueue = createDocumentExtractionEnqueueStub({
      enqueue,
      recordOrphanRequeue: vi.fn(() => Promise.resolve(4)),
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrphanDocumentExtractionReconcileService,
        { provide: PG_POOL, useValue: pool },
        { provide: DOCUMENT_EXTRACTION_ENQUEUE, useValue: extractionQueue },
      ],
    }).compile();
    const service = moduleRef.get(OrphanDocumentExtractionReconcileService);

    const count = await service.reconcileOnce();

    expect(count).toBe(0);
    expect(enqueue).not.toHaveBeenCalled();
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('LIMIT $1'), [100]);
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining("SET status = 'failed'"), [
      'doc-1',
      'documents.extractionFailureCode.orphan_requeue_exhausted',
    ]);
  });
});
