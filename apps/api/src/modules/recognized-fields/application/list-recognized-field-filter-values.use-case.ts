// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';

import { parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

@Injectable()
export class ListRecognizedFieldFilterValuesUseCase {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async execute(userId: string, fieldKey: string): Promise<string[]> {
    const trimmed = fieldKey.trim();
    if (!trimmed) {
      throw new BadRequestException('Field key is required');
    }
    const storageKey = trimmed.startsWith('global:') ? trimmed : `global:${trimmed}`;
    const result = await this.pool.query(
      `SELECT DISTINCT dfv.value_text
       FROM document_field_values dfv
       INNER JOIN documents d ON d.id = dfv.document_id
       WHERE d.user_id = $1
         AND dfv.field_storage_key = $2
         AND btrim(dfv.value_text) <> ''
       ORDER BY dfv.value_text ASC
       LIMIT 200`,
      [userId, storageKey]
    );
    const items: string[] = [];
    for (const row of result.rows) {
      const record = requireRecord(row);
      const value = parseString(record.value_text).trim();
      if (value) items.push(value);
    }
    return items;
  }
}
