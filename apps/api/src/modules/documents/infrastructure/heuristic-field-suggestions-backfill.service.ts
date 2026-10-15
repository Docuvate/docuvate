// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type pg from 'pg';

import { parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { RefreshHeuristicFieldSuggestionsUseCase } from '../application/refresh-heuristic-field-suggestions.use-case.js';
import { HEURISTIC_FIELD_EXTRACTOR_VERSION } from '../domain/heuristic-field-suggestions-fingerprint.js';

const BATCH_LIMIT = 500;

@Injectable()
export class HeuristicFieldSuggestionsBackfillService implements OnApplicationBootstrap {
  private readonly logger = new Logger(HeuristicFieldSuggestionsBackfillService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    private readonly refresh: RefreshHeuristicFieldSuggestionsUseCase
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const users = await this.pool.query<{ user_id: string }>(
        `SELECT DISTINCT user_id FROM documents`
      );
      for (const raw of users.rows) {
        const userId = parseString(requireRecord(raw).user_id);
        await this.backfillUser(userId);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Heuristic field suggestion backfill skipped: ${message}`);
    }
  }

  async backfillUser(userId: string): Promise<void> {
    const result = await this.pool.query<{ id: string }>(
      `SELECT d.id
       FROM documents d
       WHERE d.user_id = $1
         AND trim(coalesce(d.extracted_text, '')) <> ''
         AND d.status IN ('ready', 'failed')
         AND coalesce(d.heuristic_field_extractor_version, 0) < $2
       ORDER BY d.updated_at DESC
       LIMIT $3`,
      [userId, HEURISTIC_FIELD_EXTRACTOR_VERSION, BATCH_LIMIT]
    );
    const ids = result.rows.map((row) => parseString(requireRecord(row).id));
    if (ids.length === 0) {
      return;
    }
    await this.refresh.executeForUserBatch(userId, ids);
    this.logger.log(
      `Refreshed heuristic field suggestions on ${String(ids.length)} document(s) for user ${userId}`
    );
  }
}
