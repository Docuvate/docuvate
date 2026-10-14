// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

function pairKey(tagIdA: string, tagIdB: string): string {
  return tagIdA < tagIdB ? `${tagIdA}:${tagIdB}` : `${tagIdB}:${tagIdA}`;
}

@Injectable()
export class PgLabelCoOccurrenceRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  /** Tag pairs that never appear together on any labeled document for this tenant. */
  async listMutuallyExclusiveTagPairs(userId: string): Promise<ReadonlySet<string>> {
    const tags = await this.pool.query<{ id: string }>(
      `SELECT id FROM tags WHERE user_id = $1 AND is_inbox = false`,
      [userId]
    );
    const tagIds = tags.rows.map((row) => parseString(requireRecord(row).id));
    if (tagIds.length < 2) {
      return new Set();
    }

    const coOccurring = await this.pool.query<{ a: string; b: string }>(
      `SELECT dt1.tag_id::text AS a, dt2.tag_id::text AS b
       FROM document_tags dt1
       JOIN document_tags dt2
         ON dt1.document_id = dt2.document_id
        AND dt1.tag_id < dt2.tag_id
       JOIN documents d ON d.id = dt1.document_id
       WHERE d.user_id = $1`,
      [userId]
    );
    const seen = new Set<string>();
    for (const row of coOccurring.rows) {
      const record = requireRecord(row);
      seen.add(pairKey(parseString(record.a), parseString(record.b)));
    }

    const exclusive = new Set<string>();
    for (let i = 0; i < tagIds.length; i += 1) {
      for (let j = i + 1; j < tagIds.length; j += 1) {
        const left = tagIds[i];
        const right = tagIds[j];
        if (!left || !right) {
          continue;
        }
        if (!seen.has(pairKey(left, right))) {
          exclusive.add(pairKey(left, right));
        }
      }
    }
    return exclusive;
  }
}

export function tagPairConflicts(
  tagIdA: string,
  tagIdB: string,
  exclusivePairs: ReadonlySet<string>
): boolean {
  return exclusivePairs.has(pairKey(tagIdA, tagIdB));
}
