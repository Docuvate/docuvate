// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentPageTransformDto,
  PageRotationQuarterTurns,
  PageTransformSource,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';

import type { DocumentPageTransformRepository } from '../../../shared/domain/ports.js';
import { recordFromUnknown } from '../../../shared/domain/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

function asQuarterTurns(value: unknown): PageRotationQuarterTurns {
  const n = Number(value);
  if (n === 0 || n === 1 || n === 2 || n === 3) {
    return n;
  }
  return 0;
}

function asSource(value: unknown): PageTransformSource {
  return value === 'pipeline' ? 'pipeline' : 'user';
}

function mapRow(row: Record<string, unknown>): DocumentPageTransformDto {
  return {
    page: Number(row.page),
    rotationQuarterTurns: asQuarterTurns(row.rotation_quarter_turns),
    deskewDeg: Number(row.deskew_deg ?? 0),
    source: asSource(row.source),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

@Injectable()
export class PgDocumentPageTransformRepository implements DocumentPageTransformRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listForDocument(documentId: string): Promise<DocumentPageTransformDto[]> {
    const result = await this.pool.query(
      `SELECT page, rotation_quarter_turns, deskew_deg, source, updated_at
       FROM document_page_transforms
       WHERE document_id = $1
       ORDER BY page ASC`,
      [documentId]
    );
    return result.rows.map((row: Record<string, unknown>) => mapRow(row));
  }

  async replacePipelineTransforms(
    documentId: string,
    transforms: { page: number; rotationQuarterTurns: PageRotationQuarterTurns }[]
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `DELETE FROM document_page_transforms
         WHERE document_id = $1 AND source = 'pipeline'`,
        [documentId]
      );
      for (const item of transforms) {
        if (item.rotationQuarterTurns === 0) {
          continue;
        }
        await upsertTransform(client, {
          documentId,
          page: item.page,
          rotationQuarterTurns: item.rotationQuarterTurns,
          deskewDeg: 0,
          source: 'pipeline',
          correctionId: null,
        });
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async upsertUserTransform(input: {
    documentId: string;
    page: number;
    rotationQuarterTurns: PageRotationQuarterTurns;
    deskewDeg: number;
    userId: string;
    correctionId: string;
  }): Promise<DocumentPageTransformDto> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO corrections (id, user_id, document_id, kind, created_by, status)
         VALUES ($1, $2, $3, 'page', $2, 'active')
         ON CONFLICT (id) DO NOTHING`,
        [input.correctionId, input.userId, input.documentId]
      );
      const row = await upsertTransform(client, {
        documentId: input.documentId,
        page: input.page,
        rotationQuarterTurns: input.rotationQuarterTurns,
        deskewDeg: input.deskewDeg,
        source: 'user',
        correctionId: input.correctionId,
      });
      await client.query('COMMIT');
      return row;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

async function upsertTransform(
  client: PoolClient,
  input: {
    documentId: string;
    page: number;
    rotationQuarterTurns: PageRotationQuarterTurns;
    deskewDeg: number;
    source: PageTransformSource;
    correctionId: string | null;
  }
): Promise<DocumentPageTransformDto> {
  if (input.rotationQuarterTurns === 0 && input.deskewDeg === 0 && input.source === 'user') {
    await client.query(
      `DELETE FROM document_page_transforms WHERE document_id = $1 AND page = $2`,
      [input.documentId, input.page]
    );
    return {
      page: input.page,
      rotationQuarterTurns: 0,
      deskewDeg: 0,
      source: 'user',
      updatedAt: new Date().toISOString(),
    };
  }
  const result = await client.query(
    `INSERT INTO document_page_transforms (
       document_id, page, rotation_quarter_turns, deskew_deg, source, correction_id, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (document_id, page) DO UPDATE SET
       rotation_quarter_turns = EXCLUDED.rotation_quarter_turns,
       deskew_deg = EXCLUDED.deskew_deg,
       source = EXCLUDED.source,
       correction_id = COALESCE(EXCLUDED.correction_id, document_page_transforms.correction_id),
       updated_at = now()
     RETURNING page, rotation_quarter_turns, deskew_deg, source, updated_at`,
    [
      input.documentId,
      input.page,
      input.rotationQuarterTurns,
      input.deskewDeg,
      input.source,
      input.correctionId,
    ]
  );
  const row = recordFromUnknown(result.rows[0]);
  if (!row) {
    throw new Error('document_page_transforms upsert returned no row');
  }
  return mapRow(row);
}
