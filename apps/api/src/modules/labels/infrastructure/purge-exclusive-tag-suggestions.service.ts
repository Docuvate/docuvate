// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type pg from 'pg';

import { parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { tagIdConflictsWithAssigned } from '../domain/filter-exclusive-tag-suggestions.js';
import { PgLabelCoOccurrenceRepository } from './pg-label-co-occurrence.repository.js';

@Injectable()
export class PurgeExclusiveTagSuggestionsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PurgeExclusiveTagSuggestionsService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    private readonly coOccurrence: PgLabelCoOccurrenceRepository
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const users = await this.pool.query<{ user_id: string }>(
        `SELECT DISTINCT user_id FROM documents`
      );
      for (const raw of users.rows) {
        const userId = parseString(requireRecord(raw).user_id);
        await this.purgeForUser(userId);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Exclusive tag suggestion purge skipped: ${message}`);
    }
  }

  async purgeForUser(userId: string): Promise<number> {
    let removed = await this.purgeHighConfidenceContradictingNonInboxAssignments(userId);
    const exclusivePairs = await this.coOccurrence.listMutuallyExclusiveTagPairs(userId);
    if (exclusivePairs.size === 0) {
      return removed;
    }
    const rows = await this.pool.query<{ document_id: string; tag_id: string }>(
      `SELECT s.document_id, s.tag_id
       FROM document_tag_suggestions s
       INNER JOIN tags t ON t.id = s.tag_id
       INNER JOIN documents d ON d.id = s.document_id
       WHERE d.user_id = $1 AND s.dismissed = false`,
      [userId]
    );
    for (const raw of rows.rows) {
      const record = requireRecord(raw);
      const documentId = parseString(record.document_id);
      const tagId = parseString(record.tag_id);
      const assigned = await this.pool.query<{ tag_id: string }>(
        `SELECT tag_id::text AS tag_id FROM document_tags WHERE document_id = $1`,
        [documentId]
      );
      const assignedIds = new Set(
        assigned.rows.map((row) => parseString(requireRecord(row).tag_id))
      );
      if (!tagIdConflictsWithAssigned(tagId, assignedIds, exclusivePairs)) {
        continue;
      }
      await this.pool.query(
        `DELETE FROM document_tag_suggestions WHERE document_id = $1 AND tag_id = $2`,
        [documentId, tagId]
      );
      removed += 1;
    }
    if (removed > 0) {
      this.logger.log(
        `Purged ${String(removed)} exclusive-conflict tag suggestion(s) for user ${userId}`
      );
    }
    return removed;
  }

  /** Drop high-confidence non-inbox suggestions when another non-inbox label is already assigned. */
  private async purgeHighConfidenceContradictingNonInboxAssignments(
    userId: string
  ): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM document_tag_suggestions s
       USING documents d, tags st
       WHERE s.document_id = d.id
         AND d.user_id = $1
         AND st.id = s.tag_id
         AND NOT s.dismissed
         AND coalesce(s.confidence, 0) >= 0.9
         AND st.is_inbox = false
         AND (
           EXISTS (
             SELECT 1
             FROM document_tags dt
             INNER JOIN tags at ON at.id = dt.tag_id
             WHERE dt.document_id = s.document_id
               AND at.is_inbox = false
               AND dt.tag_id <> s.tag_id
           )
           OR NOT EXISTS (
             SELECT 1
             FROM document_tags dt
             INNER JOIN tags at ON at.id = dt.tag_id
             WHERE dt.document_id = s.document_id
               AND at.is_inbox = false
           )
         )`,
      [userId]
    );
    const count = result.rowCount ?? 0;
    if (count > 0) {
      this.logger.log(
        `Purged ${String(count)} high-confidence tag suggestion(s) contradicting assigned labels for user ${userId}`
      );
    }
    return count;
  }

  async purgeForDocument(userId: string, documentId: string): Promise<void> {
    const exclusivePairs = await this.coOccurrence.listMutuallyExclusiveTagPairs(userId);
    if (exclusivePairs.size === 0) {
      return;
    }
    const assigned = await this.pool.query<{ tag_id: string }>(
      `SELECT tag_id::text AS tag_id FROM document_tags WHERE document_id = $1`,
      [documentId]
    );
    const assignedIds = new Set(
      assigned.rows.map((row) => parseString(requireRecord(row).tag_id))
    );
    const suggestions = await this.pool.query<{ tag_id: string }>(
      `SELECT tag_id::text AS tag_id FROM document_tag_suggestions
       WHERE document_id = $1 AND dismissed = false`,
      [documentId]
    );
    for (const raw of suggestions.rows) {
      const tagId = parseString(requireRecord(raw).tag_id);
      if (tagIdConflictsWithAssigned(tagId, assignedIds, exclusivePairs)) {
        await this.pool.query(
          `DELETE FROM document_tag_suggestions WHERE document_id = $1 AND tag_id = $2`,
          [documentId, tagId]
        );
      }
    }
  }
}
