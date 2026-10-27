// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import {
  parseDate,
  parseNumber,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import {
  buildDescIdTiebreakerKeyset,
  decodeIdTiebreakerCursor,
  encodeIdTiebreakerCursor,
} from '../../../shared/infrastructure/pagination/id-tiebreaker-cursor.js';

export interface PendingReviewDocumentRow {
  id: string;
  createdAt: Date;
}

export interface PendingReviewDocumentPage {
  rows: PendingReviewDocumentRow[];
  hasMore: boolean;
  nextCursor: string | null;
  total: number | null;
}

@Injectable()
export class PgDocumentReviewQueueRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async countPendingDocuments(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS count
       FROM documents d
       WHERE d.user_id = $1
         AND d.status = 'ready'
         AND NOT EXISTS (
           SELECT 1
           FROM document_stack_members m_version
           WHERE m_version.document_id = d.id
             AND m_version.role = 'version'
         )
         AND (${this.pendingConditionSql('d')})`,
      [userId]
    );
    const row = requireRecord(result.rows[0] ?? {});
    return parseNumber(row.count, 0);
  }

  async listPendingDocumentPage(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<PendingReviewDocumentPage> {
    const fetchLimit = limit + 1;
    const params: unknown[] = [userId];
    let keysetSql = '';
    if (cursor) {
      const decoded = decodeIdTiebreakerCursor(cursor);
      const keyset = buildDescIdTiebreakerKeyset(
        'd.created_at',
        'd.id',
        decoded,
        params.length + 1,
        '::timestamptz'
      );
      keysetSql = ` AND ${keyset.conditionSql}`;
      params.push(...keyset.params);
    }
    params.push(fetchLimit);

    const result = await this.pool.query(
      `SELECT d.id, d.created_at
       FROM documents d
       WHERE d.user_id = $1
         AND d.status = 'ready'
         AND NOT EXISTS (
           SELECT 1
           FROM document_stack_members m_version
           WHERE m_version.document_id = d.id
             AND m_version.role = 'version'
         )
         AND (${this.pendingConditionSql('d')})
         ${keysetSql}
       ORDER BY d.created_at DESC, d.id DESC
       LIMIT $${String(params.length)}`,
      params
    );

    let rows = result.rows.map((raw) => {
      const row = requireRecord(raw);
      return {
        id: parseString(row.id),
        createdAt: parseDate(row.created_at),
      };
    });

    const hasMore = rows.length > limit;
    if (hasMore) {
      rows = rows.slice(0, limit);
    }

    let nextCursor: string | null = null;
    if (hasMore && rows.length > 0) {
      const last = rows[rows.length - 1];
      nextCursor = encodeIdTiebreakerCursor({
        v: 1,
        id: last.id,
        sortValue: last.createdAt.toISOString(),
      });
    }

    const total = cursor ? null : await this.countPendingDocuments(userId);

    return { rows, hasMore, nextCursor, total };
  }

  private pendingConditionSql(docAlias: string): string {
    return `
      EXISTS (
        SELECT 1
        FROM document_tag_suggestions s
        WHERE s.document_id = ${docAlias}.id
          AND s.dismissed = false
          AND COALESCE(s.confidence, 0) >= 0.82
          AND NOT EXISTS (
            SELECT 1 FROM document_tags dt
            WHERE dt.document_id = ${docAlias}.id AND dt.tag_id = s.tag_id
          )
      )
      OR EXISTS (
        SELECT 1
        FROM document_field_values v
        WHERE v.document_id = ${docAlias}.id
          AND v.field_storage_key LIKE 'suggestion:%'
          AND length(trim(v.value_text)) > 0
          AND COALESCE(v.confidence, 0) >= 0.85
          AND NOT (
            v.field_storage_key IN ('suggestion:vendor', 'suggestion:sender', 'suggestion:correspondent')
            AND (
              v.value_text ~ '^[0-9]{1,2}[./][0-9]{1,2}[./]'
              OR v.value_text ~ '\\m[0-9]{5}\\M'
            )
          )
      )
      OR EXISTS (
        SELECT 1
        FROM document_stack_members m_primary
        INNER JOIN document_duplicate_stacks st ON st.id = m_primary.stack_id
        WHERE m_primary.document_id = ${docAlias}.id
          AND m_primary.role = 'primary'
          AND st.user_id = $1
          AND EXISTS (
            SELECT 1
            FROM document_stack_members a
            JOIN document_stack_members b ON b.stack_id = a.stack_id AND b.document_id <> a.document_id
            JOIN document_duplicate_candidates c
              ON c.user_id = $1
             AND c.dismissed = false
             AND (
               (c.document_id = a.document_id AND c.candidate_document_id = b.document_id)
               OR (c.document_id = b.document_id AND c.candidate_document_id = a.document_id)
             )
            WHERE a.stack_id = m_primary.stack_id
            LIMIT 1
          )
      )
    `;
  }
}
