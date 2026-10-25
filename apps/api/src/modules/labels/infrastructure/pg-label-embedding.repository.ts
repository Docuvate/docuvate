// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { ValidationError } from '../../../shared/domain/errors.js';
import { normalizeLabelKey } from '../../../shared/domain/label-name-similarity.js';
import type {
  DocumentEmbeddingReference,
  LabelClusterDocumentExclusion,
  LabelEmbeddingRepository,
  LabelRecommendationBlocklistEntry,
  LabelRecommendationBlocklistPattern,
  TagCentroidRecord,
  UserDocumentEmbeddingRow,
} from '../../../shared/domain/ports.js';
import {
  parseDate,
  parseJsonString,
  parseNumber,
  parseString,
  parseStringArray,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { withTenantPgClient } from '../../../shared/infrastructure/database/tenant-pg.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { EnsureDocumentRepresentationUseCase } from '../../representation/application/ensure-document-representation.use-case.js';
import { PgDocumentRepresentationRepository } from '../../representation/infrastructure/pg-document-representation.repository.js';

function mapBlocklistEntry(row: Record<string, unknown>): LabelRecommendationBlocklistEntry {
  const sourceRaw = parseString(row.source);
  const source: LabelRecommendationBlocklistEntry['source'] =
    sourceRaw === 'dismiss' ? 'dismiss' : 'manual';
  return {
    id: parseString(row.id),
    phrase: parseString(row.phrase),
    source,
    createdAt: parseDate(row.created_at),
  };
}

function mapBlocklistPattern(row: Record<string, unknown>): LabelRecommendationBlocklistPattern {
  return {
    id: parseString(row.id),
    pattern: parseString(row.pattern),
    createdAt: parseDate(row.created_at),
  };
}

function parseVector(raw: unknown): number[] {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = parseJsonString(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((v) => Number(v)).filter((n) => Number.isFinite(n));
}

@Injectable()
export class PgLabelEmbeddingRepository implements LabelEmbeddingRepository {
  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    private readonly documentRepresentation: PgDocumentRepresentationRepository,
    private readonly ensureRepresentation: EnsureDocumentRepresentationUseCase
  ) {}

  async saveDocumentEmbedding(
    documentId: string,
    userId: string,
    model: string,
    // Vector is persisted in document_representation; model id kept for compatibility.
    embedding: number[]
  ): Promise<void> {
    if (embedding.length < 0) {
      return;
    }
    await this.pool.query(
      `INSERT INTO document_embeddings (document_id, model, embedding, updated_at)
       VALUES ($1, $2, NULL, now())
       ON CONFLICT (document_id) DO UPDATE
       SET model = $2, embedding = NULL, updated_at = now()`,
      [documentId, model]
    );
  }

  async countExtractedDocumentsForMap(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS c
       FROM documents d
       WHERE d.user_id = $1
         AND d.status = 'ready'
         AND length(trim(coalesce(d.extracted_text, ''))) >= 20
         AND NOT EXISTS (
           SELECT 1 FROM document_stack_members m
           WHERE m.document_id = d.id AND m.role = 'version'
         )`,
      [userId]
    );
    const countRow = requireRecord(result.rows[0]);
    return parseNumber(countRow.c, 0);
  }

  async listDocumentIdsMissingEmbeddings(userId: string, limit: number): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT d.id
       FROM documents d
       LEFT JOIN document_representation dr ON dr.document_id = d.id
       WHERE d.user_id = $1
         AND d.status = 'ready'
         AND length(trim(coalesce(d.extracted_text, ''))) >= 20
         AND dr.document_id IS NULL
       ORDER BY d.updated_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map((raw) => parseString(requireRecord(raw).id));
  }

  async listDocumentEmbeddingsForUser(userId: string): Promise<UserDocumentEmbeddingRow[]> {
    return this.queryDocumentEmbeddingsForUser(userId, false);
  }

  async listUserConfirmedDocumentEmbeddingsForUser(
    userId: string
  ): Promise<UserDocumentEmbeddingRow[]> {
    return this.queryDocumentEmbeddingsForUser(userId, true);
  }

  private async queryDocumentEmbeddingsForUser(
    userId: string,
    userConfirmedOnly: boolean
  ): Promise<UserDocumentEmbeddingRow[]> {
    const tagFilter = userConfirmedOnly
      ? 't.is_inbox = false AND dt.user_confirmed = true'
      : 't.is_inbox = false';
    const havingConfirmed = userConfirmedOnly
      ? 'HAVING bool_or(t.is_inbox = false AND dt.user_confirmed = true)'
      : '';
    return withTenantPgClient(this.pool, userId, async (client) => {
      const result = await client.query(
        `SELECT dr.document_id,
                dr.document_mean_scale,
                dr.document_mean_int8,
                d.title,
                d.filename,
                COALESCE(array_agg(dt.tag_id) FILTER (WHERE ${tagFilter}), '{}') AS tag_ids
         FROM document_representation dr
         INNER JOIN documents d ON d.id = dr.document_id
         LEFT JOIN document_tags dt ON dt.document_id = dr.document_id
         LEFT JOIN tags t ON t.id = dt.tag_id
         WHERE d.user_id = $1
           AND d.status = 'ready'
           AND NOT EXISTS (
             SELECT 1 FROM document_stack_members m
             WHERE m.document_id = d.id AND m.role = 'version'
           )
         GROUP BY dr.document_id, dr.document_mean_scale, dr.document_mean_int8, d.title, d.filename, d.updated_at
         ${havingConfirmed}
         ORDER BY d.updated_at DESC`,
        [userId]
      );
      return result.rows
        .map((raw) => {
          const row = requireRecord(raw);
          const scale = parseNumber(row.document_mean_scale, 0);
          const buffer = row.document_mean_int8;
          const embedding: number[] = [];
          if (Buffer.isBuffer(buffer)) {
            for (let i = 0; i < buffer.length; i += 1) {
              embedding.push(buffer.readInt8(i) * scale);
            }
          }
          return {
            documentId: parseString(row.document_id),
            title: parseString(row.title ?? ''),
            filename: parseString(row.filename ?? ''),
            embedding,
            nonInboxTagIds: parseStringArray(row.tag_ids),
          };
        })
        .filter((row) => row.embedding.length > 0);
    });
  }

  async listDismissedRecommendationKeys(userId: string): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT recommendation_key FROM label_recommendation_dismissals WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map((raw) => parseString(requireRecord(raw).recommendation_key));
  }

  async dismissRecommendation(userId: string, recommendationKey: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO label_recommendation_dismissals (user_id, recommendation_key)
       VALUES ($1, $2)
       ON CONFLICT (user_id, recommendation_key) DO NOTHING`,
      [userId, recommendationKey]
    );
  }

  async listClusterDocumentExclusions(userId: string): Promise<LabelClusterDocumentExclusion[]> {
    const result = await this.pool.query(
      `SELECT label_key, document_id
       FROM label_recommendation_cluster_exclusions
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map((raw) => {
      const row = requireRecord(raw);
      return {
        labelKey: parseString(row.label_key),
        documentId: parseString(row.document_id),
      };
    });
  }

  async addClusterDocumentExclusions(
    userId: string,
    labelKey: string,
    documentIds: string[]
  ): Promise<void> {
    const key = labelKey.trim();
    if (!key || documentIds.length === 0) {
      return;
    }
    for (const documentId of documentIds) {
      const trimmedId = documentId.trim();
      if (!trimmedId) {
        continue;
      }
      await this.pool.query(
        `INSERT INTO label_recommendation_cluster_exclusions (user_id, label_key, document_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, label_key, document_id) DO NOTHING`,
        [userId, key, trimmedId]
      );
    }
  }

  async listRecommendationBlocklist(userId: string): Promise<LabelRecommendationBlocklistEntry[]> {
    const result = await this.pool.query(
      `SELECT id, phrase, source, created_at FROM label_recommendation_blocklist
       WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows.map((raw) => mapBlocklistEntry(requireRecord(raw)));
  }

  async addRecommendationBlocklist(
    userId: string,
    phrase: string,
    source: 'manual' | 'dismiss'
  ): Promise<LabelRecommendationBlocklistEntry> {
    const trimmed = phrase.trim();
    const labelKey = normalizeLabelKey(trimmed);
    if (!labelKey) {
      throw new ValidationError('Blocklist phrase is required');
    }
    const id = crypto.randomUUID();
    const result = await this.pool.query(
      `INSERT INTO label_recommendation_blocklist (id, user_id, phrase, label_key, source)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, label_key) DO UPDATE
         SET phrase = EXCLUDED.phrase, source = EXCLUDED.source
       RETURNING id, phrase, source, created_at`,
      [id, userId, trimmed, labelKey, source]
    );
    return mapBlocklistEntry(requireRecord(result.rows[0]));
  }

  async removeRecommendationBlocklist(userId: string, entryId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM label_recommendation_blocklist WHERE id = $1 AND user_id = $2`,
      [entryId, userId]
    );
  }

  async listRecommendationBlocklistPatterns(
    userId: string
  ): Promise<LabelRecommendationBlocklistPattern[]> {
    const result = await this.pool.query(
      `SELECT id, pattern, created_at FROM label_recommendation_blocklist_patterns
       WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows.map((raw) => mapBlocklistPattern(requireRecord(raw)));
  }

  async addRecommendationBlocklistPattern(
    userId: string,
    pattern: string
  ): Promise<LabelRecommendationBlocklistPattern> {
    const trimmed = pattern.trim();
    if (!trimmed) {
      throw new ValidationError('Pattern is required');
    }
    const id = crypto.randomUUID();
    const result = await this.pool.query(
      `INSERT INTO label_recommendation_blocklist_patterns (id, user_id, pattern)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, pattern) DO UPDATE SET pattern = EXCLUDED.pattern
       RETURNING id, pattern, created_at`,
      [id, userId, trimmed]
    );
    return mapBlocklistPattern(requireRecord(result.rows[0]));
  }

  async removeRecommendationBlocklistPattern(userId: string, patternId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM label_recommendation_blocklist_patterns WHERE id = $1 AND user_id = $2`,
      [patternId, userId]
    );
  }

  async getDocumentEmbedding(documentId: string): Promise<number[] | null> {
    const ownerRow = await this.pool.query<{ user_id: string; extracted_text: string | null }>(
      `SELECT user_id, extracted_text FROM documents WHERE id = $1`,
      [documentId]
    );
    const owner = ownerRow.rows[0];
    if (ownerRow.rowCount === 0) {
      return null;
    }
    const userId = parseString(owner.user_id);
    let loaded = await this.documentRepresentation.loadDocumentMeanVector(userId, documentId);
    if (!loaded?.vector.length) {
      const text = parseString(owner.extracted_text ?? '');
      if (text.trim().length >= 20) {
        await this.ensureRepresentation.execute(userId, documentId, text);
        loaded = await this.documentRepresentation.loadDocumentMeanVector(userId, documentId);
      }
    }
    return loaded?.vector.length ? loaded.vector : null;
  }

  async listLabeledDocumentEmbeddings(
    userId: string,
    excludeDocumentId: string
  ): Promise<DocumentEmbeddingReference[]> {
    return withTenantPgClient(this.pool, userId, async (client) => {
      const result = await client.query(
        `SELECT dr.document_id,
                dr.document_mean_scale,
                dr.document_mean_int8,
                COALESCE(array_agg(dt.tag_id) FILTER (WHERE t.is_inbox = false), '{}') AS tag_ids
         FROM document_representation dr
         INNER JOIN documents d ON d.id = dr.document_id
         INNER JOIN document_tags dt ON dt.document_id = dr.document_id
         INNER JOIN tags t ON t.id = dt.tag_id
         WHERE d.user_id = $1
           AND dr.document_id <> $2
         GROUP BY dr.document_id, dr.document_mean_scale, dr.document_mean_int8
         HAVING bool_or(t.is_inbox = false)`,
        [userId, excludeDocumentId]
      );
      return result.rows
        .map((raw) => {
          const row = requireRecord(raw);
          const scale = parseNumber(row.document_mean_scale, 0);
          const buffer = row.document_mean_int8;
          const embedding: number[] = [];
          if (Buffer.isBuffer(buffer)) {
            for (let i = 0; i < buffer.length; i += 1) {
              embedding.push(buffer.readInt8(i) * scale);
            }
          }
          return {
            documentId: parseString(row.document_id),
            tagIds: parseStringArray(row.tag_ids),
            embedding,
          };
        })
        .filter((row) => row.embedding.length > 0 && row.tagIds.length > 0);
    });
  }

  async getTagCentroids(userId: string): Promise<TagCentroidRecord[]> {
    const result = await this.pool.query(
      `SELECT tec.tag_id, tec.sample_count, tec.centroid
       FROM tag_embedding_centroids tec
       INNER JOIN tags t ON t.id = tec.tag_id
       WHERE t.user_id = $1`,
      [userId]
    );
    return result.rows.map((raw) => {
      const row = requireRecord(raw);
      return {
        tagId: parseString(row.tag_id),
        sampleCount: parseNumber(row.sample_count, 0),
        centroid: parseVector(row.centroid),
      };
    });
  }

  async saveTagCentroid(
    tagId: string,
    _userId: string,
    model: string,
    sampleCount: number,
    centroid: number[]
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO tag_embedding_centroids (tag_id, model, sample_count, centroid, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, now())
       ON CONFLICT (tag_id) DO UPDATE
       SET sample_count = $3, centroid = $4::jsonb, model = $2, updated_at = now()`,
      [tagId, model, sampleCount, JSON.stringify(centroid)]
    );
  }

  async recordFeedback(
    userId: string,
    documentId: string,
    tagId: string,
    action: 'accept' | 'reject'
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO tag_embedding_feedback (user_id, document_id, tag_id, action)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (document_id, tag_id, action) DO NOTHING`,
      [userId, documentId, tagId, action]
    );
  }

  async countRejectionsForTag(userId: string, tagId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS c FROM tag_embedding_feedback
       WHERE user_id = $1 AND tag_id = $2 AND action = 'reject'`,
      [userId, tagId]
    );
    const countRow = requireRecord(result.rows[0]);
    return parseNumber(countRow.c, 0);
  }
}
