import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import type {
  DocumentEmbeddingReference,
  LabelEmbeddingRepository,
  LabelRecommendationBlocklistEntry,
  LabelRecommendationBlocklistPattern,
  TagCentroidRecord,
  UserDocumentEmbeddingRow,
} from '../../../shared/domain/ports.js';
import { normalizeLabelKey } from '../domain/label-vocabulary.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { ValidationError } from '../../../shared/domain/errors.js';

function parseVector(raw: unknown): number[] {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown;
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
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async saveDocumentEmbedding(
    documentId: string,
    userId: string,
    model: string,
    embedding: number[]
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO document_embeddings (document_id, user_id, model, embedding, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, now())
       ON CONFLICT (document_id) DO UPDATE
       SET model = $3, embedding = $4::jsonb, updated_at = now()`,
      [documentId, userId, model, JSON.stringify(embedding)]
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
    return Number(result.rows[0]?.['c'] ?? 0);
  }

  async listDocumentIdsMissingEmbeddings(userId: string, limit: number): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT d.id
       FROM documents d
       LEFT JOIN document_embeddings de ON de.document_id = d.id
       WHERE d.user_id = $1
         AND d.status = 'ready'
         AND length(trim(coalesce(d.extracted_text, ''))) >= 20
         AND de.document_id IS NULL
       ORDER BY d.updated_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map((row) => String(row['id']));
  }

  async listDocumentEmbeddingsForUser(userId: string): Promise<UserDocumentEmbeddingRow[]> {
    const result = await this.pool.query(
      `SELECT de.document_id, de.embedding, d.title, d.filename,
              COALESCE(array_agg(dt.tag_id) FILTER (WHERE t.is_inbox = false), '{}') AS tag_ids
       FROM document_embeddings de
       INNER JOIN documents d ON d.id = de.document_id
       LEFT JOIN document_tags dt ON dt.document_id = de.document_id
       LEFT JOIN tags t ON t.id = dt.tag_id
       WHERE de.user_id = $1
         AND d.status = 'ready'
         AND NOT EXISTS (
           SELECT 1 FROM document_stack_members m
           WHERE m.document_id = d.id AND m.role = 'version'
         )
       GROUP BY de.document_id, de.embedding, d.title, d.filename, d.updated_at
       ORDER BY d.updated_at DESC`,
      [userId]
    );
    return result.rows
      .map((row) => ({
        documentId: String(row['document_id']),
        title: String(row['title'] ?? ''),
        filename: String(row['filename'] ?? ''),
        embedding: parseVector(row['embedding']),
        nonInboxTagIds: (row['tag_ids'] as string[] | null)?.filter(Boolean) ?? [],
      }))
      .filter((row) => row.embedding.length > 0);
  }

  async listDismissedRecommendationKeys(userId: string): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT recommendation_key FROM label_recommendation_dismissals WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map((row) => String(row['recommendation_key']));
  }

  async dismissRecommendation(userId: string, recommendationKey: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO label_recommendation_dismissals (user_id, recommendation_key)
       VALUES ($1, $2)
       ON CONFLICT (user_id, recommendation_key) DO NOTHING`,
      [userId, recommendationKey]
    );
  }

  async listRecommendationBlocklist(userId: string): Promise<LabelRecommendationBlocklistEntry[]> {
    const result = await this.pool.query(
      `SELECT id, phrase, source, created_at FROM label_recommendation_blocklist
       WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows.map((row) => ({
      id: String(row['id']),
      phrase: String(row['phrase']),
      source: row['source'] === 'dismiss' ? 'dismiss' : 'manual',
      createdAt: new Date(String(row['created_at'])),
    }));
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
    const row = result.rows[0]!;
    return {
      id: String(row['id']),
      phrase: String(row['phrase']),
      source: row['source'] === 'dismiss' ? 'dismiss' : 'manual',
      createdAt: new Date(String(row['created_at'])),
    };
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
    return result.rows.map((row) => ({
      id: String(row['id']),
      pattern: String(row['pattern']),
      createdAt: new Date(String(row['created_at'])),
    }));
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
    const row = result.rows[0]!;
    return {
      id: String(row['id']),
      pattern: String(row['pattern']),
      createdAt: new Date(String(row['created_at'])),
    };
  }

  async removeRecommendationBlocklistPattern(userId: string, patternId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM label_recommendation_blocklist_patterns WHERE id = $1 AND user_id = $2`,
      [patternId, userId]
    );
  }

  async getDocumentEmbedding(documentId: string): Promise<number[] | null> {
    const result = await this.pool.query(
      `SELECT embedding FROM document_embeddings WHERE document_id = $1`,
      [documentId]
    );
    if (result.rowCount === 0) {
      return null;
    }
    const vector = parseVector(result.rows[0]?.['embedding']);
    return vector.length > 0 ? vector : null;
  }

  async listLabeledDocumentEmbeddings(
    userId: string,
    excludeDocumentId: string
  ): Promise<DocumentEmbeddingReference[]> {
    const result = await this.pool.query(
      `SELECT de.document_id, de.embedding,
              COALESCE(array_agg(dt.tag_id) FILTER (WHERE t.is_inbox = false), '{}') AS tag_ids
       FROM document_embeddings de
       INNER JOIN document_tags dt ON dt.document_id = de.document_id
       INNER JOIN tags t ON t.id = dt.tag_id
       WHERE de.user_id = $1
         AND de.document_id <> $2
       GROUP BY de.document_id, de.embedding
       HAVING bool_or(t.is_inbox = false)`,
      [userId, excludeDocumentId]
    );
    return result.rows
      .map((row) => ({
        documentId: String(row['document_id']),
        tagIds: (row['tag_ids'] as string[] | null)?.filter(Boolean) ?? [],
        embedding: parseVector(row['embedding']),
      }))
      .filter((row) => row.embedding.length > 0 && row.tagIds.length > 0);
  }

  async getTagCentroids(userId: string): Promise<TagCentroidRecord[]> {
    const result = await this.pool.query(
      `SELECT tag_id, sample_count, centroid FROM tag_embedding_centroids WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map((row) => ({
      tagId: String(row['tag_id']),
      sampleCount: Number(row['sample_count'] ?? 0),
      centroid: parseVector(row['centroid']),
    }));
  }

  async saveTagCentroid(
    tagId: string,
    userId: string,
    model: string,
    sampleCount: number,
    centroid: number[]
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO tag_embedding_centroids (tag_id, user_id, model, sample_count, centroid, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, now())
       ON CONFLICT (tag_id) DO UPDATE
       SET sample_count = $4, centroid = $5::jsonb, model = $3, updated_at = now()`,
      [tagId, userId, model, sampleCount, JSON.stringify(centroid)]
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
    return Number(result.rows[0]?.['c'] ?? 0);
  }
}
