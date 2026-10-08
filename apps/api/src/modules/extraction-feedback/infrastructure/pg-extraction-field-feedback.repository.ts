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
        await client.query(
          `INSERT INTO extraction_field_corrections (
             user_id, document_id, field_key, old_value, new_value,
             label_tag_ids, field_tag_id, source
           ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, 'user_correction')`,
          [
            userId,
            row.documentId,
            row.fieldKey,
            row.oldValue,
            row.newValue,
            JSON.stringify(row.labelTagIds),
            row.fieldTagId,
          ]
        );
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
      cursorClause = `AND (created_at, id) < ($2::timestamptz, $3::uuid)`;
    }
    params.push(limit);
    const limitParam = params.length;
    const result = await this.pool.query(
      `SELECT * FROM extraction_field_corrections
       WHERE user_id = $1 ${cursorClause}
       ORDER BY created_at DESC, id DESC
       LIMIT $${limitParam}`,
      params
    );
    return result.rows.map((row) => mapRow(row as Record<string, unknown>));
  }
}
