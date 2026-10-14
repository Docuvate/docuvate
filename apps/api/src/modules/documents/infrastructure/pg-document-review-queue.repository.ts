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

export interface PendingReviewDocumentRow {
  id: string;
  createdAt: Date;
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

  async listPendingDocumentIds(
    userId: string,
    limit: number,
    offset: number
  ): Promise<{ total: number; rows: PendingReviewDocumentRow[] }> {
    const total = await this.countPendingDocuments(userId);
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
       ORDER BY d.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const rows = result.rows.map((raw) => {
      const row = requireRecord(raw);
      return {
        id: parseString(row.id),
        createdAt: parseDate(row.created_at),
      };
    });
    return { total, rows };
  }

  private pendingConditionSql(docAlias: string): string {
    return `
      EXISTS (
        SELECT 1
        FROM document_tag_suggestions s
        WHERE s.document_id = ${docAlias}.id
          AND s.dismissed = false
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
