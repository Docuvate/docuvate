// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  LabelAssignmentInventory,
  LabelDocumentInventorySummaryResponseDto,
  LabelInventoryDocument,
  LabelRecommendationDocumentPreviewDto,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import {
  buildDescIdTiebreakerKeyset,
  decodeIdTiebreakerCursor,
  encodeIdTiebreakerCursor,
} from '../../../shared/infrastructure/pagination/id-tiebreaker-cursor.js';
import {
  parseDate,
  parseEnum,
  parseNumber,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { parseTagsJson } from '../../documents/infrastructure/document-row.mapper.js';

const READY_STATUSES = ['uploaded', 'queued', 'extracting', 'ready', 'failed'] as const;

@Injectable()
export class PgLabelDocumentInventoryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async loadSummary(userId: string): Promise<LabelDocumentInventorySummaryResponseDto> {
    const inventoryResult = await this.pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE has_non_inbox)::int AS labeled
       FROM (
         SELECT d.id,
           EXISTS (
             SELECT 1
             FROM document_tags dt
             INNER JOIN tags t ON t.id = dt.tag_id
             WHERE dt.document_id = d.id AND t.is_inbox = false
           ) AS has_non_inbox
         FROM documents d
         WHERE d.user_id = $1 AND d.status = 'ready'
       ) stats`,
      [userId]
    );
    const inventoryRow = requireRecord(inventoryResult.rows[0] ?? {});
    const total = parseNumber(inventoryRow.total, 0);
    const labeled = parseNumber(inventoryRow.labeled, 0);
    const inventory: LabelAssignmentInventory = {
      total,
      labeled,
      unlabeled: total - labeled,
    };

    const countsResult = await this.pool.query(
      `SELECT t.id, COUNT(*)::int AS count
       FROM document_tags dt
       INNER JOIN documents d ON d.id = dt.document_id
       INNER JOIN tags t ON t.id = dt.tag_id
       WHERE d.user_id = $1
         AND d.status = 'ready'
         AND t.is_inbox = false
       GROUP BY t.id`,
      [userId]
    );
    const documentCountByTagId: Record<string, number> = {};
    for (const raw of countsResult.rows) {
      const row = requireRecord(raw);
      documentCountByTagId[parseString(row.id)] = parseNumber(row.count, 0);
    }

    return { inventory, documentCountByTagId };
  }

  async listDocumentsPage(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<{
    documents: LabelInventoryDocument[];
    hasMore: boolean;
    nextCursor: string | null;
    total: number | null;
  }> {
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
      `SELECT d.id, d.title, d.filename, d.status, d.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'is_inbox', t.is_inbox)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags_json
       FROM documents d
       LEFT JOIN document_tags dtag ON dtag.document_id = d.id
       LEFT JOIN tags t ON t.id = dtag.tag_id
       WHERE d.user_id = $1 AND d.status = 'ready'
       ${keysetSql}
       GROUP BY d.id
       ORDER BY d.created_at DESC, d.id DESC
       LIMIT $${String(params.length)}`,
      params
    );

    let rows = result.rows;
    const hasMore = rows.length > limit;
    if (hasMore) {
      rows = rows.slice(0, limit);
    }

    const documents: LabelInventoryDocument[] = rows.map((raw) => {
      const row = requireRecord(raw);
      const tags = parseTagsJson(row.tags_json).map((tag) => ({
        id: tag.id,
        isInbox: tag.isInbox,
      }));
      return {
        id: parseString(row.id),
        title: parseString(row.title),
        filename: parseString(row.filename),
        status: parseEnum(parseString(row.status), READY_STATUSES, 'ready'),
        tags,
      };
    });

    let nextCursor: string | null = null;
    if (hasMore && rows.length > 0) {
      const last = requireRecord(rows[rows.length - 1]);
      nextCursor = encodeIdTiebreakerCursor({
        v: 1,
        id: parseString(last.id),
        sortValue: parseDate(last.created_at).toISOString(),
      });
    }

    const total = cursor
      ? null
      : (
          await this.pool.query(
            `SELECT COUNT(*)::int AS count FROM documents d WHERE d.user_id = $1 AND d.status = 'ready'`,
            [userId]
          )
        ).rows[0];

    const totalRow = total ? requireRecord(total) : null;

    return {
      documents,
      hasMore,
      nextCursor,
      total: totalRow ? parseNumber(totalRow.count, 0) : null,
    };
  }

  async loadSampleDocumentIdsByTag(
    userId: string,
    tagIds: string[],
    perTagLimit: number
  ): Promise<Map<string, string[]>> {
    if (tagIds.length === 0) {
      return new Map();
    }
    const result = await this.pool.query(
      `SELECT tag_id, document_id
       FROM (
         SELECT dt.tag_id, dt.document_id,
           ROW_NUMBER() OVER (PARTITION BY dt.tag_id ORDER BY d.updated_at DESC) AS rn
         FROM document_tags dt
         INNER JOIN documents d ON d.id = dt.document_id
         WHERE d.user_id = $1
           AND d.status = 'ready'
           AND dt.tag_id = ANY($2::uuid[])
       ) ranked
       WHERE rn <= $3`,
      [userId, tagIds, perTagLimit]
    );
    const map = new Map<string, string[]>();
    for (const raw of result.rows) {
      const row = requireRecord(raw);
      const tagId = parseString(row.tag_id);
      const documentId = parseString(row.document_id);
      const list = map.get(tagId) ?? [];
      list.push(documentId);
      map.set(tagId, list);
    }
    return map;
  }

  async loadDocumentPreviewsByIds(
    userId: string,
    ids: string[]
  ): Promise<Map<string, LabelRecommendationDocumentPreviewDto>> {
    if (ids.length === 0) {
      return new Map();
    }
    const result = await this.pool.query(
      `SELECT d.id, d.title, d.filename, d.status, d.document_date
       FROM documents d
       WHERE d.user_id = $1 AND d.id = ANY($2::uuid[])`,
      [userId, ids]
    );
    const map = new Map<string, LabelRecommendationDocumentPreviewDto>();
    for (const raw of result.rows) {
      const row = requireRecord(raw);
      const id = parseString(row.id);
      const documentDateRaw = row.document_date;
      let documentDate: string | null = null;
      if (documentDateRaw instanceof Date) {
        documentDate = documentDateRaw.toISOString().slice(0, 10);
      } else if (documentDateRaw != null) {
        documentDate = parseString(documentDateRaw).slice(0, 10);
      }
      map.set(id, {
        id,
        title: parseString(row.title),
        filename: parseString(row.filename),
        status: parseEnum(parseString(row.status), READY_STATUSES, 'ready'),
        documentDate,
      });
    }
    return map;
  }
}
