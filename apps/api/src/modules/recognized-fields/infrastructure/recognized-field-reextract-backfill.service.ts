// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { BackfillRecognizedFieldReextractionUseCase } from '../application/backfill-recognized-field-reextraction.use-case.js';

@Injectable()
export class RecognizedFieldReextractBackfillService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RecognizedFieldReextractBackfillService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    private readonly backfill: BackfillRecognizedFieldReextractionUseCase
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const result = await this.pool.query<{ user_id: string }>(
        `SELECT DISTINCT r.user_id
         FROM recognized_field_definitions r
         ORDER BY r.user_id`
      );
      const userIds = result.rows.map((raw) => parseString(requireRecord(raw).user_id));
      await this.backfill.executeForAllUsers(userIds);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Recognized-field reextract backfill skipped: ${message}`);
    }
  }
}
