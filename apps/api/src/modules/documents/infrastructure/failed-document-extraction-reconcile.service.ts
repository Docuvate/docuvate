// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

/** Documents marked failed after a transient queue error despite usable extracted text. */
@Injectable()
export class FailedDocumentExtractionReconcileService implements OnModuleInit {
  private readonly logger = new Logger(FailedDocumentExtractionReconcileService.name);

  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async onModuleInit(): Promise<void> {
    try {
      const result = await this.pool.query(
        `UPDATE documents
         SET status = 'ready',
             extraction_failure_reason = NULL,
             updated_at = now()
         WHERE status = 'failed'
           AND trim(coalesce(extracted_text, '')) <> ''
         RETURNING id`
      );
      const count = result.rowCount ?? 0;
      if (count > 0) {
        this.logger.log(
          `Reconciled ${String(count)} failed document(s) with extracted text to ready`
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed-document extraction reconcile skipped: ${message}`);
    }
  }
}
