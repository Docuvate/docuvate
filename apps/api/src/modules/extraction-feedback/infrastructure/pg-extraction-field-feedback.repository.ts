import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import type {
  ExtractionFieldCorrectionRecord,
  ExtractionFieldFeedbackRepository,
} from '../../../shared/domain/ports.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

function mapRow(row: Record<string, unknown>): ExtractionFieldCorrectionRecord {
  const labelTagIdsRaw = row['label_tag_ids'];
  const labelTagIds = Array.isArray(labelTagIdsRaw)
    ? labelTagIdsRaw.map((id) => String(id))
    : [];
  return {
    id: String(row['id']),
    userId: String(row['user_id']),
    documentId: String(row['document_id']),
    fieldKey: String(row['field_key']),
    oldValue: String(row['old_value'] ?? ''),
    newValue: String(row['new_value'] ?? ''),
    labelTagIds,
    fieldTagId: row['field_tag_id'] != null ? String(row['field_tag_id']) : null,
    source: 'user_correction',
    createdAt: new Date(String(row['created_at'])),
  };
}

const LIST_SQL = `
  SELECT c.*,
    COALESCE(
      (
        SELECT array_agg(l.tag_id::text ORDER BY l.tag_id)
        FROM extraction_field_correction_labels l
        WHERE l.correction_id = c.id
      ),
      ARRAY[]::text[]
    ) AS label_tag_ids
  FROM extraction_field_corrections c
`;

@Injectable()
export class PgExtractionFieldFeedbackRepository implements ExtractionFieldFeedbackRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async insertMany(
    userId: string,
    rows: Array<{
      documentId: string;
      fieldKey: string;
      oldValue: string;
      newValue: string;
      labelTagIds: string[];
      fieldTagId: string | null;
    }>
  ): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const row of rows) {
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO extraction_field_corrections (
             user_id, document_id, field_key, old_value, new_value, field_tag_id, source
           ) VALUES ($1, $2, $3, $4, $5, $6, 'user_correction')
           RETURNING id`,
          [
            userId,
            row.documentId,
            row.fieldKey,
            row.oldValue,
            row.newValue,
            row.fieldTagId,
          ]
        );
        const correctionId = inserted.rows[0]?.id;
        if (!correctionId) {
          throw new Error('extraction_field_corrections insert missing id');
        }
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
      return rows.length;
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
       LIMIT $${limitParam}`,
      params
    );
    return result.rows.map((row) => mapRow(row as Record<string, unknown>));
  }
}
