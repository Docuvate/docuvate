// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  RECOGNIZED_FIELD_FILTER_VALUES_DEFAULT_LIMIT,
  RECOGNIZED_FIELD_FILTER_VALUES_MAX_LIMIT,
  type RecognizedFieldFilterValuesQuery,
} from '@docuvate/contracts';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';

import { parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import {
  decodeFieldFilterValueCursor,
  encodeFieldFilterValueCursor,
} from '../infrastructure/field-filter-value-cursor.js';

function clampLimit(limit: number | undefined): number {
  const raw = limit ?? RECOGNIZED_FIELD_FILTER_VALUES_DEFAULT_LIMIT;
  return Math.min(RECOGNIZED_FIELD_FILTER_VALUES_MAX_LIMIT, Math.max(1, raw));
}

@Injectable()
export class ListRecognizedFieldFilterValuesUseCase {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async execute(userId: string, query: RecognizedFieldFilterValuesQuery) {
    const trimmed = query.key.trim();
    if (!trimmed) {
      throw new BadRequestException('Field key is required');
    }
    const storageKey = trimmed.startsWith('global:') ? trimmed : `global:${trimmed}`;
    const q = query.q?.trim() ?? '';
    const limit = clampLimit(query.limit);
    const values: unknown[] = [userId, storageKey];
    const where: string[] = [
      'd.user_id = $1',
      'dfv.field_storage_key = $2',
      "btrim(dfv.value_text) <> ''",
    ];
    if (q.length > 0) {
      values.push(`%${q}%`);
      where.push(`dfv.value_text ILIKE $${String(values.length)}`);
    }
    if (query.cursor) {
      const cursor = decodeFieldFilterValueCursor(query.cursor);
      values.push(cursor.value);
      where.push(`dfv.value_text > $${String(values.length)}`);
    }
    values.push(limit + 1);
    const limitIdx = values.length;
    const sql = `SELECT DISTINCT dfv.value_text
       FROM document_field_values dfv
       INNER JOIN documents d ON d.id = dfv.document_id
       WHERE ${where.join(' AND ')}
       ORDER BY dfv.value_text ASC
       LIMIT $${String(limitIdx)}`;
    const result = await this.pool.query(sql, values);
    const rows: string[] = [];
    for (const raw of result.rows) {
      const record = requireRecord(raw);
      const value = parseString(record.value_text).trim();
      if (value) {
        rows.push(value);
      }
    }
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    let total: number | null = null;
    if (!query.cursor) {
      const countValues: unknown[] = [userId, storageKey];
      const countWhere: string[] = [
        'd.user_id = $1',
        'dfv.field_storage_key = $2',
        "btrim(dfv.value_text) <> ''",
      ];
      if (q.length > 0) {
        countValues.push(`%${q}%`);
        countWhere.push(`dfv.value_text ILIKE $${String(countValues.length)}`);
      }
      const countResult = await this.pool.query(
        `SELECT COUNT(DISTINCT dfv.value_text)::int AS count
         FROM document_field_values dfv
         INNER JOIN documents d ON d.id = dfv.document_id
         WHERE ${countWhere.join(' AND ')}`,
        countValues
      );
      const countRow = requireRecord(countResult.rows[0]);
      total = Number.parseInt(parseString(countRow.count), 10);
    }

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1];
      nextCursor = encodeFieldFilterValueCursor({ v: 1, value: last });
    }

    return { items, nextCursor, hasMore, total };
  }
}
