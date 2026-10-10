// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MatchingAlgorithm } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import type { TagWriteOptions, TaxonomyRepository } from '../../../shared/domain/ports.js';
import {
  parseBoolean,
  parseEnum,
  parseOptionalNumber,
  parseOptionalString,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type {
  CorrespondentEntity,
  TagEntity,
  TagSuggestionEntity,
} from '../domain/taxonomy.entity.js';
import {
  parseTagSuggestionDecisionTier,
  parseTagSuggestionSource,
} from '../../labels/domain/tag-suggestion-parsing.js';
import { tagSuggestionJoinRowSchema } from '../../labels/domain/tag-suggestion-row.schema.js';

const INBOX_NAME = 'Posteingang';

const MATCHING_ALGORITHMS: readonly MatchingAlgorithm[] = ['none', 'any', 'all', 'exact', 'regex'];
const TAG_SUGGESTION_SOURCES: readonly ('rule' | 'embedding')[] = ['rule', 'embedding'];

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
        `INSERT INTO document_tags (document_id, tag_id)
         SELECT document_id, $1 FROM document_tags WHERE tag_id = $2
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

  async assignTagToDocument(documentId: string, tagId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [documentId, tagId]
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
    const result = await this.pool.query(
      `SELECT s.reason, s.confidence, s.source, s.decision_tier, t.* FROM document_tag_suggestions s
       INNER JOIN tags t ON t.id = s.tag_id
       WHERE s.document_id = $1 AND t.user_id = $2 AND s.dismissed = false
       ORDER BY t.name ASC`,
      [documentId, userId]
    );
    return result.rows.map((row) => {
      const parsed = tagSuggestionJoinRowSchema.parse(row);
      return {
        tag: this.mapTagFromJoinRow(parsed),
        reason: typeof parsed.reason === 'string' ? parsed.reason : String(parsed.reason ?? ''),
        confidence:
          parsed.confidence === null || parsed.confidence === undefined
            ? undefined
            : Number(parsed.confidence),
        source: parseTagSuggestionSource(parsed.source),
        decisionTier: parseTagSuggestionDecisionTier(parsed.decision_tier),
      };
    });
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

  async setCorrespondentForDocument(
    documentId: string,
    correspondentId: string | null
  ): Promise<void> {
    await this.pool.query(
      `UPDATE documents SET correspondent_id = $2, updated_at = now() WHERE id = $1`,
      [documentId, correspondentId]
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
