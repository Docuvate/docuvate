// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import type {
  ExtractionFieldCorrectionRecord,
  ExtractionFieldFeedbackRepository,
  LabelFieldExtractionExample,
} from '../../../shared/domain/ports.js';
import {
  parseDate,
  parseOptionalString,
  parseString,
  parseStringArray,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { inferFieldCorrectionAnchorLabel } from '../domain/infer-field-correction-anchor.js';

function mapRow(row: Record<string, unknown>): ExtractionFieldCorrectionRecord {
  const labelTagIds = parseStringArray(row.label_tag_ids);
  return {
    id: parseString(row.id),
    userId: parseString(row.user_id),
    documentId: parseString(row.document_id),
    fieldKey: parseString(row.field_key),
    oldValue: parseString(row.old_value),
    newValue: parseString(row.new_value),
    labelTagIds,
    fieldTagId: parseOptionalString(row.field_tag_id),
    source: 'user_correction',
    createdAt: parseDate(row.created_at),
  };
}

const LIST_SQL = `
  SELECT c.*,
    d.extracted_text AS document_extracted_text,
    COALESCE(
      (
        SELECT array_agg(l.tag_id::text ORDER BY l.tag_id)
        FROM extraction_field_correction_labels l
        WHERE l.correction_id = c.id
      ),
      ARRAY[]::text[]
    ) AS label_tag_ids
  FROM extraction_field_corrections c
  JOIN documents d ON d.id = c.document_id
`;

@Injectable()
export class PgExtractionFieldFeedbackRepository implements ExtractionFieldFeedbackRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async insertCorrectionsIdempotent(
    userId: string,
    rows: {
      documentId: string;
      fieldKey: string;
      oldValue: string;
      newValue: string;
      labelTagIds: string[];
      fieldTagId: string | null;
    }[]
  ): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const client = await this.pool.connect();
    let insertedCount = 0;
    try {
      await client.query('BEGIN');
      for (const row of rows) {
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO extraction_field_corrections (
             user_id, document_id, field_key, old_value, new_value, field_tag_id, source
           ) VALUES ($1, $2, $3, $4, $5, $6, 'user_correction')
           ON CONFLICT (user_id, document_id, field_key, old_value, new_value) DO NOTHING
           RETURNING id`,
          [userId, row.documentId, row.fieldKey, row.oldValue, row.newValue, row.fieldTagId]
        );
        const correctionId = inserted.rows[0]?.id;
        if (!correctionId) {
          continue;
        }
        insertedCount += 1;
        if (row.labelTagIds.length > 0) {
          await client.query(
            `INSERT INTO extraction_field_correction_labels (correction_id, tag_id)
             SELECT $1, t.id FROM tags t
             WHERE t.user_id = $2 AND t.id::text = ANY($3::text[])
             ON CONFLICT DO NOTHING`,
            [correctionId, userId, row.labelTagIds]
          );
        }
      }
      await client.query('COMMIT');
      return insertedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async upsertConfirmations(
    userId: string,
    rows: {
      documentId: string;
      fieldKey: string;
      labelTagIds: string[];
      fieldTagId: string | null;
    }[]
  ): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const client = await this.pool.connect();
    let upsertedCount = 0;
    try {
      await client.query('BEGIN');
      for (const row of rows) {
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO extraction_field_confirmations (
             user_id, document_id, field_key, field_tag_id
           ) VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, document_id, field_key) DO NOTHING
           RETURNING id`,
          [userId, row.documentId, row.fieldKey, row.fieldTagId]
        );
        const confirmationId = inserted.rows[0]?.id;
        if (!confirmationId) {
          continue;
        }
        upsertedCount += 1;
        if (row.labelTagIds.length > 0) {
          await client.query(
            `INSERT INTO extraction_field_confirmation_labels (confirmation_id, tag_id)
             SELECT $1, t.id FROM tags t
             WHERE t.user_id = $2 AND t.id::text = ANY($3::text[])
             ON CONFLICT DO NOTHING`,
            [confirmationId, userId, row.labelTagIds]
          );
        }
      }
      await client.query('COMMIT');
      return upsertedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listForUser(
    userId: string,
    options?: { limit?: number; afterCreatedAt?: Date; afterId?: string }
  ): Promise<ExtractionFieldCorrectionRecord[]> {
    const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
    const params: unknown[] = [userId];
    let cursorClause = '';
    if (options?.afterCreatedAt && options.afterId) {
      params.push(options.afterCreatedAt.toISOString(), options.afterId);
      cursorClause = `AND (c.created_at, c.id) < ($2::timestamptz, $3::uuid)`;
    }
    params.push(limit);
    const limitParam = params.length;
    const result = await this.pool.query(
      `${LIST_SQL}
       WHERE c.user_id = $1 ${cursorClause}
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT $${String(limitParam)}`,
      params
    );
    return result.rows.map((row) => mapRow(requireRecord(row)));
  }

  async listRecentForFieldKeys(
    userId: string,
    fieldKeys: readonly string[],
    options?: { limitPerField?: number }
  ): Promise<LabelFieldExtractionExample[]> {
    const keys = [...new Set(fieldKeys.map((key) => key.trim()).filter(Boolean))];
    if (keys.length === 0) {
      return [];
    }
    const limitPerField = Math.min(Math.max(options?.limitPerField ?? 5, 1), 20);
    const fetchLimit = Math.min(keys.length * limitPerField * 4, 500);
    const result = await this.pool.query(
      `${LIST_SQL}
       WHERE c.user_id = $1 AND c.field_key = ANY($2::text[])
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT $3`,
      [userId, keys, fetchLimit]
    );
    const perField = new Map<string, LabelFieldExtractionExample[]>();
    for (const raw of result.rows) {
      const record = requireRecord(raw);
      const row = mapRow(record);
      if (!row.newValue.trim()) {
        continue;
      }
      const bucket = perField.get(row.fieldKey) ?? [];
      if (bucket.some((item) => item.value === row.newValue)) {
        continue;
      }
      if (bucket.length >= limitPerField) {
        continue;
      }
      const documentText = parseOptionalString(record.document_extracted_text) ?? '';
      const anchor = inferFieldCorrectionAnchorLabel(documentText, row.newValue.trim());
      bucket.push({
        fieldKey: row.fieldKey,
        value: row.newValue.trim(),
        labelTagIds: row.labelTagIds,
        ...(anchor ? { label: anchor } : {}),
      });
      perField.set(row.fieldKey, bucket);
    }
    return [...perField.values()].flat();
  }

  async listCorrectedFieldKeysForDocument(userId: string, documentId: string): Promise<string[]> {
    const result = await this.pool.query<{ field_key: string }>(
      `SELECT DISTINCT field_key
       FROM extraction_field_corrections
       WHERE user_id = $1 AND document_id = $2`,
      [userId, documentId]
    );
    return result.rows.map((row) => parseString(requireRecord(row).field_key));
  }
}
