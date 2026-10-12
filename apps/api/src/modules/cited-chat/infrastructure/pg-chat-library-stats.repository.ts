// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type { ChatStatsOperation } from '../domain/chat-intent-prototypes.schema.js';

const VERSION_STACK_FILTER = `NOT EXISTS (
  SELECT 1 FROM document_stack_members sm
  WHERE sm.document_id = d.id AND sm.role = 'version'
)`;

export interface TenantTagRow {
  id: string;
  name: string;
}

export interface StatsDocumentRow {
  id: string;
  title: string;
  filename: string;
}

@Injectable()
export class PgChatLibraryStatsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listUserTags(userId: string): Promise<TenantTagRow[]> {
    const result = await this.pool.query<{ id: string; name: string }>(
      `SELECT t.id, t.name
       FROM tags t
       WHERE t.user_id = $1 AND t.is_inbox = false
       ORDER BY t.name ASC`,
      [userId]
    );
    return result.rows.map((row) => ({ id: row.id, name: row.name }));
  }

  async countDocuments(userId: string, options?: { status?: 'ready'; tagId?: string }): Promise<number> {
    const params: unknown[] = [userId];
    let tagJoin = '';
    let statusFilter = '';
    if (options?.tagId) {
      params.push(options.tagId);
      tagJoin = `INNER JOIN document_tags dt ON dt.document_id = d.id AND dt.tag_id = $${String(params.length)}`;
    }
    if (options?.status === 'ready') {
      statusFilter = `AND d.status = 'ready'`;
    }
    const result = await this.pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c
       FROM documents d
       ${tagJoin}
       WHERE d.user_id = $1
         AND ${VERSION_STACK_FILTER}
         ${statusFilter}`,
      params
    );
    return result.rows[0]?.c ?? 0;
  }

  async listDocumentsByTag(
    userId: string,
    tagId: string,
    limit: number
  ): Promise<StatsDocumentRow[]> {
    const result = await this.pool.query<{
      id: string;
      title: string;
      filename: string;
    }>(
      `SELECT d.id, d.title, d.filename
       FROM documents d
       INNER JOIN document_tags dt ON dt.document_id = d.id AND dt.tag_id = $2
       WHERE d.user_id = $1
         AND ${VERSION_STACK_FILTER}
       ORDER BY d.title ASC, d.filename ASC
       LIMIT $3`,
      [userId, tagId, limit]
    );
    return result.rows;
  }

  async resolveStatsQuery(
    userId: string,
    operation: ChatStatsOperation,
    labelTagId: string | null
  ): Promise<{ count: number | null; documents: StatsDocumentRow[] }> {
    switch (operation) {
      case 'count_total':
        return { count: await this.countDocuments(userId), documents: [] };
      case 'count_ready':
        return { count: await this.countDocuments(userId, { status: 'ready' }), documents: [] };
      case 'count_by_label':
        if (!labelTagId) {
          return { count: null, documents: [] };
        }
        return {
          count: await this.countDocuments(userId, { tagId: labelTagId }),
          documents: [],
        };
      case 'list_by_label':
        if (!labelTagId) {
          return { count: null, documents: [] };
        }
        return {
          count: null,
          documents: await this.listDocumentsByTag(userId, labelTagId, 20),
        };
      default: {
        const exhaustive: never = operation;
        throw new Error(`Unhandled stats operation: ${String(exhaustive)}`);
      }
    }
  }
}
