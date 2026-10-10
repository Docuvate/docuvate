// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateCandidateSource } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import type {
  DuplicateCandidateEntity,
  DuplicateRepository,
} from '../../../shared/domain/ports.js';
import {
  parseBoolean,
  parseEnum,
  parseJsonString,
  parseNumber,
  parseOptionalDate,
  parseOptionalString,
  parseString,
  parseStringArray,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

const DUPLICATE_SOURCES: readonly DuplicateCandidateSource[] = ['hash', 'embedding'];

function parseVector(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw.map((v) => Number(v));
  if (typeof raw === 'string') {
    try {
      const parsed = parseJsonString(raw);
      return Array.isArray(parsed) ? parsed.map((v) => Number(v)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parsePostgresUuidArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((id) => parseString(id)).filter((id) => id.length > 0);
  }
  if (typeof value === 'string') {
    const inner = value.replace(/^\{|\}$/g, '');
    if (!inner) return [];
    return inner
      .split(',')
      .map((id) => id.replace(/^"|"$/g, '').trim())
      .filter((id) => id.length > 0);
  }
  return parseStringArray(value);
}

function mapCandidateRow(row: Record<string, unknown>): DuplicateCandidateEntity {
  return {
    id: parseString(row.id),
    userId: parseString(row.user_id),
    documentId: parseString(row.document_id),
    candidateDocumentId: parseString(row.candidate_document_id),
    candidateTitle: parseString(row.candidate_title),
    candidateFilename: parseString(row.candidate_filename),
    similarity: parseNumber(row.similarity),
    source: parseEnum(row.source, DUPLICATE_SOURCES, 'embedding'),
    dismissed: parseBoolean(row.dismissed),
  };
}

@Injectable()
export class PgDuplicateRepository implements DuplicateRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async upsertCandidate(
    userId: string,
    documentId: string,
    candidateDocumentId: string,
    similarity: number,
    source: DuplicateCandidateSource
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO document_duplicate_candidates
         (user_id, document_id, candidate_document_id, similarity, source)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (document_id, candidate_document_id) DO UPDATE SET
         similarity = GREATEST(document_duplicate_candidates.similarity, EXCLUDED.similarity),
         source = CASE
           WHEN EXCLUDED.source = 'hash' THEN 'hash'
           ELSE document_duplicate_candidates.source
         END`,
      [userId, documentId, candidateDocumentId, similarity, source]
    );
    await this.pool.query(
      `INSERT INTO document_duplicate_candidates
         (user_id, document_id, candidate_document_id, similarity, source)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (document_id, candidate_document_id) DO UPDATE SET
         similarity = GREATEST(document_duplicate_candidates.similarity, EXCLUDED.similarity),
         source = CASE
           WHEN EXCLUDED.source = 'hash' THEN 'hash'
           ELSE document_duplicate_candidates.source
         END`,
      [userId, candidateDocumentId, documentId, similarity, source]
    );
  }

  async isPairDismissed(
    userId: string,
    documentId: string,
    candidateDocumentId: string
  ): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT bool_or(dismissed) AS dismissed
       FROM document_duplicate_candidates
       WHERE user_id = $1
         AND (
           (document_id = $2 AND candidate_document_id = $3)
           OR (document_id = $3 AND candidate_document_id = $2)
         )`,
      [userId, documentId, candidateDocumentId]
    );
    const raw: unknown = result.rows[0];
    if (!raw) return false;
    return parseBoolean(requireRecord(raw).dismissed);
  }

  async listForDocument(documentId: string, userId: string): Promise<DuplicateCandidateEntity[]> {
    const result = await this.pool.query(
      `SELECT ranked.id, ranked.user_id, ranked.document_id, ranked.candidate_document_id,
              ranked.similarity, ranked.source, ranked.dismissed,
              ranked.candidate_title, ranked.candidate_filename
       FROM (
         SELECT DISTINCT ON (c.candidate_document_id)
                c.id, c.user_id, c.document_id, c.candidate_document_id, c.similarity, c.source, c.dismissed,
                d.title AS candidate_title, d.filename AS candidate_filename
         FROM document_duplicate_candidates c
         JOIN documents d ON d.id = c.candidate_document_id
         WHERE c.document_id = $1 AND c.user_id = $2 AND c.dismissed = false
         ORDER BY c.candidate_document_id, c.similarity DESC
       ) ranked
       ORDER BY ranked.similarity DESC`,
      [documentId, userId]
    );
    return result.rows.map((raw) => mapCandidateRow(requireRecord(raw)));
  }

  async dismiss(documentId: string, candidateDocumentId: string, userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE document_duplicate_candidates SET dismissed = true
       WHERE user_id = $1 AND document_id = $2 AND candidate_document_id = $3`,
      [userId, documentId, candidateDocumentId]
    );
    await this.pool.query(
      `UPDATE document_duplicate_candidates SET dismissed = true
       WHERE user_id = $1 AND document_id = $2 AND candidate_document_id = $3`,
      [userId, candidateDocumentId, documentId]
    );
  }

  async countPendingByDocumentIds(
    userId: string,
    documentIds: string[]
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (documentIds.length === 0) return counts;
    const result = await this.pool.query(
      `SELECT document_id, COUNT(*)::int AS cnt
       FROM document_duplicate_candidates
       WHERE user_id = $1 AND dismissed = false AND document_id = ANY($2::uuid[])
       GROUP BY document_id`,
      [userId, documentIds]
    );
    for (const raw of result.rows) {
      const row = requireRecord(raw);
      counts.set(parseString(row.document_id), parseNumber(row.cnt));
    }
    return counts;
  }

  async findDocumentIdsByHash(
    userId: string,
    hash: string,
    excludeDocumentId: string
  ): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT id FROM documents
       WHERE user_id = $1 AND content_hash = $2 AND id <> $3`,
      [userId, hash, excludeDocumentId]
    );
    return result.rows.map((raw) => parseString(requireRecord(raw).id));
  }

  async listDocumentIdsBySharedHash(userId: string): Promise<string[][]> {
    const result = await this.pool.query(
      `SELECT array_agg(id ORDER BY created_at ASC) AS ids
       FROM documents
       WHERE user_id = $1 AND content_hash IS NOT NULL AND content_hash <> ''
       GROUP BY content_hash
       HAVING COUNT(*) > 1`,
      [userId]
    );
    return result.rows.map((raw) => parsePostgresUuidArray(requireRecord(raw).ids));
  }

  async listPendingPairs(
    userId: string
  ): Promise<{ documentId: string; candidateDocumentId: string }[]> {
    const result = await this.pool.query(
      `SELECT document_id, candidate_document_id
       FROM document_duplicate_candidates
       WHERE user_id = $1 AND dismissed = false`,
      [userId]
    );
    return result.rows.map((raw) => {
      const row = requireRecord(raw);
      return {
        documentId: parseString(row.document_id),
        candidateDocumentId: parseString(row.candidate_document_id),
      };
    });
  }

  async listDocumentEmbeddings(
    userId: string,
    excludeDocumentId: string
  ): Promise<
    {
      documentId: string;
      embedding: number[];
      filename: string;
      title: string;
      documentDate: Date | null;
      extractedText: string | null;
      extractedFields: unknown;
    }[]
  > {
    const result = await this.pool.query(
      `SELECT e.document_id, e.embedding,
              d.filename, d.title, d.document_date, d.extracted_text,
              (
                SELECT jsonb_build_object(
                  'blocks',
                  COALESCE(
                    (
                      SELECT jsonb_agg(jsonb_build_object('page', b.page) ORDER BY b.page)
                      FROM document_extraction_blocks b
                      WHERE b.document_id = d.id
                    ),
                    '[]'::jsonb
                  )
                )
              ) AS extraction_payload
       FROM document_embeddings e
       JOIN documents d ON d.id = e.document_id
       WHERE d.user_id = $1 AND e.document_id <> $2`,
      [userId, excludeDocumentId]
    );
    return result.rows
      .map((raw) => {
        const row = requireRecord(raw);
        return {
          documentId: parseString(row.document_id),
          embedding: parseVector(row.embedding),
          filename: parseString(row.filename),
          title: parseString(row.title ?? row.filename),
          documentDate: parseOptionalDate(row.document_date),
          extractedText: parseOptionalString(row.extracted_text),
          extractedFields: row.extraction_payload,
        };
      })
      .filter((row) => row.embedding.length > 0);
  }
}
