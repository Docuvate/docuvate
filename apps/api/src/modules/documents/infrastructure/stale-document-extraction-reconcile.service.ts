// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { isRecord, parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { workerExtractTimeoutMs } from '../../../shared/infrastructure/worker/worker-fetch.js';
import { EXTRACTION_TIMEOUT_FAILURE_MESSAGE } from '../../extraction/domain/extraction-queue-failures.js';
import {
  type ExtractionReconcileDocument,
  type ExtractionReconcileJob,
  type ExtractionReconcileStatus,
  planExtractionReconcile,
} from '../../extraction/domain/plan-extraction-reconcile.js';
import { ExtractionQueueService } from '../../extraction/infrastructure/extraction-queue.service.js';

const RECONCILE_INTERVAL_MS = 60_000;

export interface ExtractionReconcileStore {
  query(
    queryText: string,
    values?: unknown[]
  ): Promise<{ rowCount: number | null; rows: unknown[] }>;
}

function parseReconcileStatus(value: string): ExtractionReconcileStatus | null {
  switch (value) {
    case 'queued':
    case 'extracting':
      return value;
    default:
      return null;
  }
}

@Injectable()
export class StaleDocumentExtractionReconcileService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StaleDocumentExtractionReconcileService.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(PG_POOL) private readonly pool: ExtractionReconcileStore,
    private readonly extractionQueue: ExtractionQueueService
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
  async reconcileOnce(): Promise<{ failed: number; enqueued: number }> {
    if (!this.extractionQueue.isReady()) {
      return { failed: 0, enqueued: 0 };
    }
    try {
      const docs = await this.listInFlightDocuments();
      const jobs = new Map<string, ExtractionReconcileJob>();
      for (const doc of docs) {
        jobs.set(doc.id, await this.extractionQueue.inspectExtractionJob(doc.id));
      }
      const plan = planExtractionReconcile(docs, jobs, Date.now(), workerExtractTimeoutMs());
      let failed = 0;
      for (const documentId of plan.failIds) {
        failed += await this.failStuckExtracting(documentId);
      }
      let enqueued = 0;
      for (const item of plan.enqueue) {
        await this.extractionQueue.ensureQueued(item.id, item.userId);
        enqueued += 1;
      }
      if (failed > 0 || enqueued > 0) {
        this.logger.warn(
          `Extraction reconcile failed ${String(failed)} stuck extracting document(s), re-enqueued ${String(enqueued)} orphaned queued document(s)`
        );
      }
      return { failed, enqueued };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Stale document extraction reconcile skipped: ${message}`);
      return { failed: 0, enqueued: 0 };
    }
  }

  private async listInFlightDocuments(): Promise<ExtractionReconcileDocument[]> {
    const result = await this.pool.query(
      `SELECT id, user_id, status FROM documents WHERE status IN ('queued', 'extracting')`
    );
    const docs: ExtractionReconcileDocument[] = [];
    for (const raw of result.rows) {
      if (!isRecord(raw)) {
        continue;
      }
      const id = parseString(raw.id).trim();
      const userId = parseString(raw.user_id).trim();
      const status = parseReconcileStatus(parseString(raw.status).trim());
      if (!id || !userId || !status) {
        continue;
      }
      docs.push({ id, userId, status });
    }
    return docs;
  }

  private async failStuckExtracting(documentId: string): Promise<number> {
    const result = await this.pool.query(
      `UPDATE documents
       SET status = 'failed',
           extraction_failure_reason = $1,
           updated_at = now()
       WHERE id = $2
         AND status = 'extracting'
       RETURNING id`,
      [EXTRACTION_TIMEOUT_FAILURE_MESSAGE, documentId]
    );
    return result.rowCount ?? 0;
  }
}
