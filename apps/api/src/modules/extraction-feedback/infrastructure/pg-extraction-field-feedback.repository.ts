// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { canonicalFieldName } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import type {
  ExtractionFieldCorrectionRecord,
  ExtractionFieldFeedbackRepository,
  FieldConfirmationWrite,
  FieldCorrectionWrite,
  FieldTrainingExample,
  LabelFieldExtractionExample,
} from '../../../shared/domain/ports.js';
import {
  parseDate,
  parseEnum,
  parseOptionalString,
  parseString,
  parseStringArray,
  requireRecord,
} from '../../../shared/domain/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { inferFieldCorrectionAnchorLabel } from '../domain/infer-field-correction-anchor.js';
import { mapFeedbackPosition, replaceFeedbackPosition } from './pg-field-feedback-position.js';

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

/** Resolves ($1 user, $2 canonical name) to an `extraction_field_names` id, creating it once. */
const UPSERT_FIELD_NAME_SQL = `
  INSERT INTO extraction_field_names (user_id, name) VALUES ($1, $2)
  ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
`;

const FEEDBACK_KINDS = ['confirmation', 'correction'] as const;

/** Keyset on millisecond precision: the cursor round-trips through a JS Date. */
const TRAINING_EXAMPLES_SQL = `
  WITH examples AS (
    SELECT 'confirmation' AS kind, c.id AS feedback_id, c.document_id, n.name AS field_name,
      c.value_text AS value, c.confirmed_at AS recorded_at, p.id AS position_id
    FROM extraction_field_confirmations c
    JOIN extraction_field_names n ON n.id = c.field_name_id
    LEFT JOIN extraction_field_feedback_positions p ON p.confirmation_id = c.id
    WHERE c.user_id = $1 AND btrim(COALESCE(c.value_text, '')) <> ''
    UNION ALL
    SELECT 'correction', c.id, c.document_id, n.name, c.new_value, c.created_at, p.id
    FROM extraction_field_corrections c
    JOIN extraction_field_names n ON n.id = c.field_name_id
    LEFT JOIN extraction_field_feedback_positions p ON p.correction_id = c.id
    WHERE c.user_id = $1 AND btrim(c.new_value) <> ''
  )
  SELECT e.kind, e.feedback_id, e.document_id, e.field_name, e.value, e.recorded_at,
    p.id AS position_id, p.source AS position_source, p.page AS position_page,
    p.doc_char_start AS position_doc_char_start, p.doc_char_end AS position_doc_char_end,
    p.x0 AS position_x0, p.y0 AS position_y0, p.x1 AS position_x1, p.y1 AS position_y1,
    COALESCE(
      (SELECT array_agg(t.block_index ORDER BY t.block_index)
       FROM extraction_field_feedback_position_tokens t WHERE t.position_id = p.id),
      ARRAY[]::int[]
    ) AS position_block_indexes
  FROM examples e
  LEFT JOIN extraction_field_feedback_positions p ON p.id = e.position_id
  WHERE $2::timestamptz IS NULL
    OR (date_trunc('milliseconds', e.recorded_at), e.feedback_id) > ($2::timestamptz, $3::uuid)
  ORDER BY date_trunc('milliseconds', e.recorded_at), e.feedback_id
  LIMIT $4
`;

@Injectable()
export class PgExtractionFieldFeedbackRepository implements ExtractionFieldFeedbackRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async insertCorrectionsIdempotent(userId: string, rows: FieldCorrectionWrite[]): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const client = await this.pool.connect();
    let insertedCount = 0;
    try {
      await client.query('BEGIN');
      for (const row of rows) {
        const inserted = await client.query<{ id: string }>(
          `WITH field_name AS (${UPSERT_FIELD_NAME_SQL})
           INSERT INTO extraction_field_corrections (
             user_id, document_id, field_key, old_value, new_value, field_tag_id, source, field_name_id
           )
           SELECT $1, $3, $4, $5, $6, $7, 'user_correction', field_name.id FROM field_name
           ON CONFLICT (user_id, document_id, field_key, old_value, new_value) DO NOTHING
           RETURNING id`,
          [
            userId,
            canonicalFieldName(row.fieldKey),
            row.documentId,
            row.fieldKey,
            row.oldValue,
            row.newValue,
            row.fieldTagId,
          ]
        );
        const correctionId = inserted.rows[0]?.id;
        if (!correctionId) {
          continue;
        }
        insertedCount += 1;
        await replaceFeedbackPosition(client, { correctionId }, row.position);
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

  async upsertConfirmations(userId: string, rows: FieldConfirmationWrite[]): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const client = await this.pool.connect();
    let upsertedCount = 0;
    try {
      await client.query('BEGIN');
      for (const row of rows) {
        const written = await client.query<{ id: string }>(
          `WITH field_name AS (${UPSERT_FIELD_NAME_SQL})
           INSERT INTO extraction_field_confirmations (
             user_id, document_id, field_key, field_tag_id, value_text, field_name_id
           )
           SELECT $1, $3, $4, $5, $6, field_name.id FROM field_name
           ON CONFLICT (user_id, document_id, field_key) DO UPDATE SET
             value_text = EXCLUDED.value_text,
             field_tag_id = EXCLUDED.field_tag_id,
             confirmed_at = now()
           WHERE extraction_field_confirmations.value_text IS DISTINCT FROM EXCLUDED.value_text
           RETURNING id`,
          [
            userId,
            canonicalFieldName(row.fieldKey),
            row.documentId,
            row.fieldKey,
            row.fieldTagId,
            row.value,
          ]
        );
        const confirmationId = written.rows[0]?.id;
        if (!confirmationId) {
          continue;
        }
        upsertedCount += 1;
        await replaceFeedbackPosition(client, { confirmationId }, row.position);
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

  async listTrainingExamples(
    userId: string,
    options: { limit: number; after: { recordedAt: Date; feedbackId: string } | null }
  ): Promise<FieldTrainingExample[]> {
    const limit = Math.min(Math.max(options.limit, 1), 1000);
    const result = await this.pool.query(TRAINING_EXAMPLES_SQL, [
      userId,
      options.after?.recordedAt.toISOString() ?? null,
      options.after?.feedbackId ?? null,
      limit,
    ]);
    return result.rows.map((raw) => {
      const row = requireRecord(raw);
      return {
        feedbackId: parseString(row.feedback_id),
        kind: parseEnum(row.kind, FEEDBACK_KINDS, 'correction'),
        documentId: parseString(row.document_id),
        fieldName: parseString(row.field_name),
        value: parseString(row.value),
        recordedAt: parseDate(row.recorded_at),
        position: mapFeedbackPosition(row),
      };
    });
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
