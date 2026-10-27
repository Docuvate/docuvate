// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { workerExtractTimeoutSeconds } from '../../../shared/infrastructure/worker/worker-fetch.js';
import { EXTRACTION_TIMEOUT_FAILURE_MESSAGE } from '../../extraction/domain/extraction-queue-failures.js';

const RECONCILE_INTERVAL_MS = 60_000;

@Injectable()
export class StaleDocumentExtractionReconcileService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StaleDocumentExtractionReconcileService.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

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

  /** Exposed for tests: fail queued/extracting rows older than the extract deadline. */
  async reconcileOnce(): Promise<number> {
    try {
      const deadlineSeconds = workerExtractTimeoutSeconds();
      const result = await this.pool.query<{ id: string }>(
        `UPDATE documents
         SET status = 'failed',
             extraction_failure_reason = $1,
             updated_at = now()
         WHERE status IN ('queued', 'extracting')
           AND updated_at < now() - ($2::int * interval '1 second')
         RETURNING id`,
        [EXTRACTION_TIMEOUT_FAILURE_MESSAGE, deadlineSeconds]
      );
      const count = result.rowCount ?? 0;
      if (count > 0) {
        this.logger.warn(
          `Marked ${String(count)} stale queued/extracting document(s) as ${EXTRACTION_TIMEOUT_FAILURE_MESSAGE}`
        );
      }
      return count;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Stale document extraction reconcile skipped: ${message}`);
      return 0;
    }
  }
}
