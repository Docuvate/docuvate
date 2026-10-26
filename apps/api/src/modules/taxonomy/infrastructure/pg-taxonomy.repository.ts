// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MatchingAlgorithm } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import type {
  TagSearchParams,
  TagSearchPage,
  TagWriteOptions,
  TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import {
  parseBoolean,
  parseEnum,
  parseOptionalString,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import {
  decodeTagSearchCursor,
  encodeTagSearchCursor,
} from './tag-search-cursor.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import {
  parseTagSuggestionDecisionTier,
  parseTagSuggestionSource,
} from '../../labels/domain/tag-suggestion-parsing.js';
import { tagSuggestionJoinRowSchema } from '../../labels/domain/tag-suggestion-row.schema.js';
import type {
  CorrespondentEntity,
  TagEntity,
  TagSuggestionEntity,
} from '../domain/taxonomy.entity.js';

const INBOX_NAME = 'Posteingang';

const MATCHING_ALGORITHMS: readonly MatchingAlgorithm[] = ['none', 'any', 'all', 'exact', 'regex'];

@Injectable()
export class PgTaxonomyRepository implements TaxonomyRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listTags(userId: string): Promise<TagEntity[]> {
    const result = await this.pool.query(
      `SELECT * FROM tags WHERE user_id = $1 ORDER BY is_inbox DESC, name ASC`,
      [userId]
    );
    return result.rows.map((raw) => this.mapTag(requireRecord(raw)));
  }

  async searchTags(userId: string, params: TagSearchParams): Promise<TagSearchPage> {
    const q = params.q?.trim() ?? '';
    const excludeInbox = params.excludeInbox !== false;
    const limit = Math.max(1, Math.min(params.limit, 100));
    const values: unknown[] = [userId];
    const where: string[] = ['user_id = $1'];
    if (excludeInbox) {
      where.push('is_inbox = false');
    }
    if (q.length > 0) {
      values.push(`%${q}%`);
      where.push(`name ILIKE $${String(values.length)}`);
    }
    let cursorPayload: ReturnType<typeof decodeTagSearchCursor> | null = null;
    if (params.cursor) {
      cursorPayload = decodeTagSearchCursor(params.cursor);
      values.push(cursorPayload.sortName, cursorPayload.id);
      const sortIdx = values.length - 1;
      const idIdx = values.length;
      where.push(
        `(lower(name) > lower($${String(sortIdx)}) OR (lower(name) = lower($${String(sortIdx)}) AND id > $${String(idIdx)}))`
      );
    }
    values.push(limit + 1);
    const limitIdx = values.length;
    const sql = `SELECT * FROM tags WHERE ${where.join(' AND ')} ORDER BY lower(name) ASC, id ASC LIMIT $${String(limitIdx)}`;
    const result = await this.pool.query(sql, values);
    const rows = result.rows.map((raw) => this.mapTag(requireRecord(raw)));
    const hasMore = rows.length > limit;
    const entities = hasMore ? rows.slice(0, limit) : rows;

    let total: number | null = null;
    if (!params.cursor) {
      const countValues: unknown[] = [userId];
      const countWhere: string[] = ['user_id = $1'];
      if (excludeInbox) {
        countWhere.push('is_inbox = false');
      }
      if (q.length > 0) {
        countValues.push(`%${q}%`);
        countWhere.push(`name ILIKE $${String(countValues.length)}`);
      }
      const countResult = await this.pool.query(
        `SELECT COUNT(*)::int AS count FROM tags WHERE ${countWhere.join(' AND ')}`,
        countValues
      );
      const countRow = requireRecord(countResult.rows[0]);
      total = Number.parseInt(parseString(countRow.count), 10);
    }

    let nextCursor: string | null = null;
    if (hasMore && entities.length > 0) {
      const last = entities[entities.length - 1];
      nextCursor = encodeTagSearchCursor({
        v: 1,
        sortName: last.name,
        id: last.id,
      });
    }

    return { entities, hasMore, nextCursor, total };
  }

  async findTagByIdForUser(id: string, userId: string): Promise<TagEntity | null> {
    const result = await this.pool.query(`SELECT * FROM tags WHERE id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);
    const raw: unknown = result.rows[0];
    return raw ? this.mapTag(requireRecord(raw)) : null;
  }

  async createTag(userId: string, name: string, options: TagWriteOptions = {}): Promise<TagEntity> {
    const trimmed = name.trim();
    if (!trimmed) throw new ValidationError('Tag name is required');
    if (options.isInbox) {
      await this.pool.query(
        `UPDATE tags SET is_inbox = false, updated_at = now() WHERE user_id = $1 AND is_inbox = true`,
        [userId]
      );
    }
    const id = crypto.randomUUID();
    const result = await this.pool.query(
      `INSERT INTO tags (id, user_id, name, color, is_inbox, matching_algorithm, match_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        id,
        userId,
        trimmed,
        options.color ?? null,
        options.isInbox ?? false,
        options.matchingAlgorithm ?? 'none',
        options.match?.trim() ?? '',
      ]
    );
    return this.mapTag(requireRecord(result.rows[0]));
  }

  async updateTag(
    id: string,
    userId: string,
    patch: TagWriteOptions & { name?: string }
  ): Promise<TagEntity> {
    const existing = await this.findTagByIdForUser(id, userId);
    if (!existing) throw new NotFoundError('Tag');
    if (existing.isInbox && patch.name && patch.name.trim() !== existing.name) {
      throw new ValidationError('Inbox tag name cannot be changed');
    }
    if (patch.isInbox) {
      await this.pool.query(
        `UPDATE tags SET is_inbox = false, updated_at = now() WHERE user_id = $1 AND is_inbox = true AND id <> $2`,
        [userId, id]
      );
    }
    const result = await this.pool.query(
      `UPDATE tags SET
         name = COALESCE($3, name),
         color = COALESCE($4, color),
         is_inbox = COALESCE($5, is_inbox),
         matching_algorithm = COALESCE($6, matching_algorithm),
         match_text = COALESCE($7, match_text),
         updated_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [
        id,
        userId,
        patch.name?.trim() ?? null,
        patch.color === undefined ? null : patch.color,
        patch.isInbox ?? null,
        patch.matchingAlgorithm ?? null,
        patch.match?.trim() ?? null,
      ]
    );
    return this.mapTag(requireRecord(result.rows[0]));
  }

  async deleteTag(id: string, userId: string): Promise<void> {
    const existing = await this.findTagByIdForUser(id, userId);
    if (!existing) throw new NotFoundError('Tag');
    if (existing.isInbox) throw new ValidationError('Inbox tag cannot be deleted');
    await this.pool.query(`DELETE FROM tags WHERE id = $1 AND user_id = $2`, [id, userId]);
  }

  async mergeTags(userId: string, keepTagId: string, removeTagId: string): Promise<void> {
    if (keepTagId === removeTagId) {
      throw new ValidationError('Cannot merge a tag with itself');
    }
    const keep = await this.findTagByIdForUser(keepTagId, userId);
    const remove = await this.findTagByIdForUser(removeTagId, userId);
    if (!keep || !remove) {
      throw new NotFoundError('Tag');
    }
    if (keep.isInbox || remove.isInbox) {
      throw new ValidationError('Inbox tag cannot be merged');
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO document_tags (document_id, tag_id, user_confirmed)
         SELECT document_id, $1, user_confirmed FROM document_tags WHERE tag_id = $2
         ON CONFLICT DO NOTHING`,
        [keepTagId, removeTagId]
      );
      await client.query(`DELETE FROM document_tags WHERE tag_id = $1`, [removeTagId]);
      await client.query(`DELETE FROM document_tag_suggestions WHERE tag_id = $1`, [removeTagId]);
      await client.query(`DELETE FROM tag_embedding_centroids WHERE tag_id = $1`, [removeTagId]);
      await client.query(`DELETE FROM tag_embedding_feedback WHERE tag_id = $1`, [removeTagId]);
      await client.query(`DELETE FROM tags WHERE id = $1 AND user_id = $2`, [removeTagId, userId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async ensureInboxTag(userId: string): Promise<TagEntity> {
    const existing = await this.pool.query(
      `SELECT * FROM tags WHERE user_id = $1 AND is_inbox = true LIMIT 1`,
      [userId]
    );
    const raw: unknown = existing.rows[0];
    if (raw) return this.mapTag(requireRecord(raw));
    return this.createTag(userId, INBOX_NAME, { color: '#2563eb', isInbox: true });
  }

  async listCorrespondents(userId: string): Promise<CorrespondentEntity[]> {
    const result = await this.pool.query(
      `SELECT * FROM correspondents WHERE user_id = $1 ORDER BY name ASC`,
      [userId]
    );
    return result.rows.map((raw) => this.mapCorrespondent(requireRecord(raw)));
  }

  async findCorrespondentByIdForUser(
    id: string,
    userId: string
  ): Promise<CorrespondentEntity | null> {
    const result = await this.pool.query(
      `SELECT * FROM correspondents WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    const raw: unknown = result.rows[0];
    return raw ? this.mapCorrespondent(requireRecord(raw)) : null;
  }

  async createCorrespondent(
    userId: string,
    name: string,
    matchingAlgorithm: MatchingAlgorithm = 'none',
    match = ''
  ): Promise<CorrespondentEntity> {
    const trimmed = name.trim();
    if (!trimmed) throw new ValidationError('Correspondent name is required');
    const id = crypto.randomUUID();
    const result = await this.pool.query(
      `INSERT INTO correspondents (id, user_id, name, matching_algorithm, match_text)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, userId, trimmed, matchingAlgorithm, match.trim()]
    );
    return this.mapCorrespondent(requireRecord(result.rows[0]));
  }

  async updateCorrespondent(
    id: string,
    userId: string,
    patch: { name?: string; matchingAlgorithm?: MatchingAlgorithm; match?: string }
  ): Promise<CorrespondentEntity> {
    const result = await this.pool.query(
      `UPDATE correspondents SET
         name = COALESCE($3, name),
         matching_algorithm = COALESCE($4, matching_algorithm),
         match_text = COALESCE($5, match_text),
         updated_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [
        id,
        userId,
        patch.name?.trim() ?? null,
        patch.matchingAlgorithm ?? null,
        patch.match?.trim() ?? null,
      ]
    );
    if (!result.rows[0]) throw new NotFoundError('Correspondent');
    return this.mapCorrespondent(requireRecord(result.rows[0]));
  }

  async deleteCorrespondent(id: string, userId: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM correspondents WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    if (!result.rows[0]) throw new NotFoundError('Correspondent');
  }

  async listTagsForDocument(documentId: string): Promise<TagEntity[]> {
    const result = await this.pool.query(
      `SELECT t.* FROM tags t
       INNER JOIN document_tags dt ON dt.tag_id = t.id
       WHERE dt.document_id = $1 ORDER BY t.name ASC`,
      [documentId]
    );
    return result.rows.map((raw) => this.mapTag(requireRecord(raw)));
  }

  async listTagsForDocuments(documentIds: string[]): Promise<Map<string, TagEntity[]>> {
    const grouped = new Map<string, TagEntity[]>();
    if (documentIds.length === 0) {
      return grouped;
    }
    const result = await this.pool.query(
      `SELECT dt.document_id::text AS document_id, t.* FROM tags t
       INNER JOIN document_tags dt ON dt.tag_id = t.id
       WHERE dt.document_id = ANY($1::uuid[])
       ORDER BY dt.document_id, t.name ASC`,
      [documentIds]
    );
    for (const raw of result.rows) {
      const record = requireRecord(raw);
      const documentId = String(record.document_id);
      const tag = this.mapTag(record);
      const list = grouped.get(documentId);
      if (list) {
        list.push(tag);
      } else {
        grouped.set(documentId, [tag]);
      }
    }
    return grouped;
  }

  async assignTagToDocument(
    documentId: string,
    tagId: string,
    options?: { userConfirmed?: boolean }
  ): Promise<void> {
    const userConfirmed = options?.userConfirmed === true;
    await this.pool.query(
      `INSERT INTO document_tags (document_id, tag_id, user_confirmed)
       VALUES ($1, $2, $3)
       ON CONFLICT (document_id, tag_id)
       DO UPDATE SET user_confirmed = (document_tags.user_confirmed OR EXCLUDED.user_confirmed)`,
      [documentId, tagId, userConfirmed]
    );
  }

  async removeTagFromDocument(documentId: string, tagId: string): Promise<void> {
    await this.pool.query(`DELETE FROM document_tags WHERE document_id = $1 AND tag_id = $2`, [
      documentId,
      tagId,
    ]);
  }

  async clearInboxTagForDocument(documentId: string, userId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM document_tags dt
       USING tags t
       WHERE dt.document_id = $1 AND dt.tag_id = t.id AND t.user_id = $2 AND t.is_inbox = true`,
      [documentId, userId]
    );
  }

  async listSuggestions(documentId: string, userId: string): Promise<TagSuggestionEntity[]> {
    const batch = await this.listSuggestionsForDocuments([documentId], userId);
    return batch.get(documentId) ?? [];
  }

  async listSuggestionsForDocuments(
    documentIds: string[],
    userId: string
  ): Promise<Map<string, TagSuggestionEntity[]>> {
    const grouped = new Map<string, TagSuggestionEntity[]>();
    if (documentIds.length === 0) {
      return grouped;
    }
    const result = await this.pool.query(
      `SELECT s.document_id::text AS document_id, s.reason, s.confidence, s.source, s.decision_tier, t.*
       FROM document_tag_suggestions s
       INNER JOIN tags t ON t.id = s.tag_id
       WHERE s.document_id = ANY($1::uuid[]) AND t.user_id = $2 AND s.dismissed = false
       ORDER BY s.document_id, t.name ASC`,
      [documentIds, userId]
    );
    for (const row of result.rows) {
      const record = requireRecord(row);
      const documentId = String(record.document_id);
      const parsed = tagSuggestionJoinRowSchema.parse(row);
      const suggestion: TagSuggestionEntity = {
        tag: this.mapTagFromJoinRow(parsed),
        reason: typeof parsed.reason === 'string' ? parsed.reason : '',
        confidence:
          parsed.confidence === null || parsed.confidence === undefined
            ? undefined
            : Number(parsed.confidence),
        source: parseTagSuggestionSource(parsed.source),
        decisionTier: parseTagSuggestionDecisionTier(parsed.decision_tier),
      };
      const list = grouped.get(documentId);
      if (list) {
        list.push(suggestion);
      } else {
        grouped.set(documentId, [suggestion]);
      }
    }
    return grouped;
  }

  async upsertSuggestion(
    documentId: string,
    tagId: string,
    reason: string,
    options?: {
      source?: 'rule' | 'embedding' | 'embedding_density';
      confidence?: number;
      decisionTier?: 'auto_apply' | 'confirm' | 'none';
    }
  ): Promise<void> {
    const source = options?.source ?? 'rule';
    const confidence = options?.confidence ?? null;
    const decisionTier = options?.decisionTier ?? null;
    await this.pool.query(
      `INSERT INTO document_tag_suggestions (document_id, tag_id, reason, dismissed, source, confidence, decision_tier)
       VALUES ($1, $2, $3, false, $4, $5, $6)
       ON CONFLICT (document_id, tag_id) DO UPDATE SET
         reason = CASE
           WHEN document_tag_suggestions.source = 'rule' AND EXCLUDED.source IN ('embedding', 'embedding_density')
           THEN document_tag_suggestions.reason
           ELSE EXCLUDED.reason
         END,
         source = CASE
           WHEN document_tag_suggestions.source = 'rule' AND EXCLUDED.source IN ('embedding', 'embedding_density')
           THEN document_tag_suggestions.source
           ELSE EXCLUDED.source
         END,
         confidence = COALESCE(EXCLUDED.confidence, document_tag_suggestions.confidence),
         decision_tier = COALESCE(EXCLUDED.decision_tier, document_tag_suggestions.decision_tier),
         dismissed = false`,
      [documentId, tagId, reason, source, confidence, decisionTier]
    );
  }

  async dismissSuggestion(documentId: string, tagId: string): Promise<void> {
    await this.pool.query(
      `UPDATE document_tag_suggestions SET dismissed = true WHERE document_id = $1 AND tag_id = $2`,
      [documentId, tagId]
    );
  }

  async clearSuggestion(documentId: string, tagId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM document_tag_suggestions WHERE document_id = $1 AND tag_id = $2`,
      [documentId, tagId]
    );
  }

  private mapTagFromJoinRow(row: {
    id: string;
    user_id: string;
    name: string;
    color: string | null;
    is_inbox: boolean;
    matching_algorithm: string;
    match_text: string;
  }): TagEntity {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color,
      isInbox: row.is_inbox,
      matchingAlgorithm: this.parseMatchingAlgorithm(row.matching_algorithm),
      match: row.match_text,
    };
  }

  private parseMatchingAlgorithm(value: string): MatchingAlgorithm {
    const allowed: MatchingAlgorithm[] = ['none', 'any', 'all', 'exact', 'regex'];
    for (const item of allowed) {
      if (item === value) {
        return item;
      }
    }
    return 'none';
  }

  private mapTag(row: Record<string, unknown>): TagEntity {
    return {
      id: parseString(row.id),
      userId: parseString(row.user_id),
      name: parseString(row.name),
      color: parseOptionalString(row.color),
      isInbox: parseBoolean(row.is_inbox),
      matchingAlgorithm: parseEnum(row.matching_algorithm, MATCHING_ALGORITHMS, 'none'),
      match: parseString(row.match_text),
    };
  }

  private mapCorrespondent(row: Record<string, unknown>): CorrespondentEntity {
    return {
      id: parseString(row.id),
      userId: parseString(row.user_id),
      name: parseString(row.name),
      matchingAlgorithm: parseEnum(row.matching_algorithm, MATCHING_ALGORITHMS, 'none'),
      match: parseString(row.match_text),
    };
  }
}
