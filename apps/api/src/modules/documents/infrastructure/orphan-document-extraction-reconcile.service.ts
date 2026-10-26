// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type { DocumentExtractionEnqueuePort } from '../domain/document-extraction-enqueue.port.js';
import type { OrphanReconcileDbPort } from '../domain/orphan-reconcile-db.port.js';
import { ExtractionQueueService } from '../../extraction/infrastructure/extraction-queue.service.js';

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
    @Inject(PG_POOL) private readonly pool: OrphanReconcileDbPort,
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

  private async listOrphanCandidates(): Promise<OrphanRow[]> {
    const result = await this.pool.query(
      `SELECT id, user_id
       FROM documents
       WHERE status IN ('queued', 'extracting')`
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
