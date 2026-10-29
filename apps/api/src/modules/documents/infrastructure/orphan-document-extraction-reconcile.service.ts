// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type pg from 'pg';

import { parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { extractionFailureReasonKey } from '../../extraction/domain/extraction-failure.js';
import type { DocumentExtractionEnqueuePort } from '../domain/document-extraction-enqueue.port.js';
import { DOCUMENT_EXTRACTION_ENQUEUE } from '../domain/document-extraction-enqueue.token.js';
import {
  maxOrphanExtractionRequeues,
  orphanExtractionBatchSize,
  planOrphanRequeue,
} from '../domain/orphan-extraction-requeue.config.js';

const RECONCILE_INTERVAL_MS = 60_000;

interface OrphanRow {
  id: string;
  userId: string;
}

@Injectable()
export class OrphanDocumentExtractionReconcileService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrphanDocumentExtractionReconcileService.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    @Inject(DOCUMENT_EXTRACTION_ENQUEUE)
    private readonly extractionQueue: DocumentExtractionEnqueuePort
  ) {}

  async onModuleInit(): Promise<void> {
    await this.reconcileOnce();
    this.intervalId = setInterval(() => {
      void this.reconcileOnce();
    }, RECONCILE_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Exposed for tests. */
  async reconcileOnce(): Promise<number> {
    try {
      const rows = await this.listOrphanCandidates();
      let requeued = 0;
      for (const row of rows) {
        if (await this.extractionQueue.isJobQueuedOrActive(row.id)) {
          continue;
        }
        try {
          const requeueCount = await this.extractionQueue.recordOrphanRequeue(row.id);
          if (planOrphanRequeue(requeueCount, maxOrphanExtractionRequeues()) === 'fail') {
            await this.markOrphanFailed(row.id);
            continue;
          }
          await this.extractionQueue.enqueue(row.id, row.userId);
          requeued += 1;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Could not re-enqueue extraction for document ${row.id}: ${message}`
          );
        }
      }
      if (requeued > 0) {
        this.logger.log(`Re-enqueued ${String(requeued)} orphan document extraction job(s)`);
      }
      return requeued;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Orphan document extraction reconcile failed: ${message}`);
      return 0;
    }
  }

  private async markOrphanFailed(documentId: string): Promise<void> {
    await this.pool.query(
      `UPDATE documents
       SET status = 'failed', extraction_failure_reason = $2, updated_at = now()
       WHERE id = $1 AND status IN ('queued', 'extracting')`,
      [documentId, extractionFailureReasonKey('orphan_requeue_exhausted')]
    );
    this.logger.warn(`Document ${documentId} exceeded the orphan re-enqueue bound; marked failed`);
  }

  private async listOrphanCandidates(): Promise<OrphanRow[]> {
    const result = await this.pool.query<{ id: string; user_id: string }>(
      `SELECT id, user_id
       FROM documents
       WHERE status IN ('queued', 'extracting')
       ORDER BY updated_at ASC
       LIMIT $1`,
      [orphanExtractionBatchSize()]
    );
    const out: OrphanRow[] = [];
    for (const row of result.rows) {
      const id = parseString(row.id).trim();
      const userId = parseString(row.user_id).trim();
      if (id && userId) {
        out.push({ id, userId });
      }
    }
    return out;
  }
}
