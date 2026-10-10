// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import type {
  DuplicateStackMemberRow,
  DuplicateStackRepository,
  DuplicateStackSummary,
} from '../../../shared/domain/ports.js';
import {
  parseDate,
  parseEnum,
  parseNumber,
  parseOptionalEnum,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type { DocumentStatus } from '../../documents/domain/document.entity.js';

const STACK_ROLES: readonly ('primary' | 'version')[] = ['primary', 'version'];
const DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  'uploaded',
  'queued',
  'extracting',
  'ready',
  'failed',
];

@Injectable()
export class PgDuplicateStackRepository implements DuplicateStackRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async syncFromPendingCandidates(userId: string): Promise<void> {
    const result = await this.pool.query(
      `SELECT document_id, candidate_document_id
       FROM document_duplicate_candidates
       WHERE user_id = $1 AND dismissed = false`,
      [userId]
    );
    for (const raw of result.rows) {
      const row = requireRecord(raw);
      await this.linkPair(
        userId,
        parseString(row.document_id),
        parseString(row.candidate_document_id)
      );
    }
  }

  async linkPair(userId: string, documentIdA: string, documentIdB: string): Promise<void> {
    if (documentIdA === documentIdB) return;

    const memberA = await this.getMembership(documentIdA, userId);
    const memberB = await this.getMembership(documentIdB, userId);

    if (memberA?.stackId === memberB?.stackId && memberA) {
      return;
    }

    if (!memberA && !memberB) {
      const primaryId = await this.pickPrimaryDocumentId(userId, documentIdA, documentIdB);
      const versionId = primaryId === documentIdA ? documentIdB : documentIdA;
      const stackId = await this.createStack(userId);
      await this.insertMember(stackId, userId, primaryId, 'primary');
      await this.insertMember(stackId, userId, versionId, 'version');
      return;
    }

    if (memberA && !memberB) {
      await this.insertMember(memberA.stackId, userId, documentIdB, 'version');
      return;
    }

    if (!memberA && memberB) {
      await this.insertMember(memberB.stackId, userId, documentIdA, 'version');
      return;
    }

    if (memberA && memberB && memberA.stackId !== memberB.stackId) {
      await this.mergeStacks(userId, memberA.stackId, memberB.stackId);
    }
  }

  async getMembership(
    documentId: string,
    userId: string
  ): Promise<{ stackId: string; role: 'primary' | 'version' } | null> {
    const result = await this.pool.query(
      `SELECT m.stack_id, m.role
       FROM document_stack_members m
       INNER JOIN document_duplicate_stacks s ON s.id = m.stack_id
       WHERE m.document_id = $1 AND s.user_id = $2`,
      [documentId, userId]
    );
    const raw: unknown = result.rows[0];
    if (!raw) return null;
    const row = requireRecord(raw);
    const role = parseOptionalEnum(row.role, STACK_ROLES);
    if (!role) return null;
    return { stackId: parseString(row.stack_id), role };
  }

  async listMembers(stackId: string, userId: string): Promise<DuplicateStackMemberRow[]> {
    const result = await this.pool.query(
      `SELECT m.stack_id, m.document_id, m.role, m.joined_at,
              d.title, d.filename, d.status, d.mime_type
       FROM document_stack_members m
       INNER JOIN document_duplicate_stacks s ON s.id = m.stack_id
       JOIN documents d ON d.id = m.document_id
       WHERE m.stack_id = $1 AND s.user_id = $2
       ORDER BY CASE WHEN m.role = 'primary' THEN 0 ELSE 1 END, m.joined_at ASC`,
      [stackId, userId]
    );
    return result.rows.map((raw) => {
      const row = requireRecord(raw);
      const role = parseEnum(row.role, STACK_ROLES, 'version');
      return {
        stackId: parseString(row.stack_id),
        documentId: parseString(row.document_id),
        role,
        title: parseString(row.title),
        filename: parseString(row.filename),
        status: parseEnum(row.status, DOCUMENT_STATUSES, 'uploaded'),
        mimeType: parseString(row.mime_type),
        joinedAt: parseDate(row.joined_at),
      };
    });
  }

  async summariesForPrimaryDocuments(
    userId: string,
    documentIds: string[]
  ): Promise<Map<string, DuplicateStackSummary>> {
    const summaries = new Map<string, DuplicateStackSummary>();
    if (documentIds.length === 0) return summaries;

    const counts = await this.pool.query(
      `SELECT m_primary.document_id AS primary_id, m.stack_id,
              COUNT(*) FILTER (WHERE m.role = 'version')::int AS version_count
       FROM document_stack_members m_primary
       INNER JOIN document_duplicate_stacks s ON s.id = m_primary.stack_id
       JOIN document_stack_members m ON m.stack_id = m_primary.stack_id
       WHERE s.user_id = $1
         AND m_primary.role = 'primary'
         AND m_primary.document_id = ANY($2::uuid[])
       GROUP BY m_primary.document_id, m.stack_id`,
      [userId, documentIds]
    );

    for (const raw of counts.rows) {
      const row = requireRecord(raw);
      const primaryId = parseString(row.primary_id);
      const stackId = parseString(row.stack_id);
      const versionCount = parseNumber(row.version_count);
      const pending = await this.stackHasPendingReview(userId, stackId);
      summaries.set(primaryId, { stackId, versionCount, pendingReview: pending });
    }
    return summaries;
  }

  async setPrimary(userId: string, stackId: string, documentId: string): Promise<void> {
    const member = await this.getMembership(documentId, userId);
    if (member?.stackId !== stackId) {
      throw new Error('Document is not in this stack');
    }

    await this.pool.query(
      `UPDATE document_stack_members m SET role = 'version'
       FROM document_duplicate_stacks s
       WHERE m.stack_id = s.id AND s.user_id = $2 AND m.stack_id = $1 AND m.role = 'primary'`,
      [stackId, userId]
    );
    await this.pool.query(
      `UPDATE document_stack_members m SET role = 'primary'
       FROM document_duplicate_stacks s
       WHERE m.stack_id = s.id AND s.user_id = $2 AND m.stack_id = $1 AND m.document_id = $3`,
      [stackId, userId, documentId]
    );
    await this.pool.query(
      `UPDATE document_duplicate_stacks SET updated_at = now() WHERE id = $1 AND user_id = $2`,
      [stackId, userId]
    );
  }

  async removeMember(userId: string, documentId: string): Promise<void> {
    const member = await this.getMembership(documentId, userId);
    if (!member) return;

    if (member.role === 'primary') {
      const versions = await this.pool.query(
        `SELECT m.document_id FROM document_stack_members m
         INNER JOIN document_duplicate_stacks s ON s.id = m.stack_id
         WHERE m.stack_id = $1 AND s.user_id = $2 AND m.role = 'version'
         ORDER BY m.joined_at ASC LIMIT 1`,
        [member.stackId, userId]
      );
      const nextPrimaryRaw: unknown = versions.rows[0];
      const nextPrimary = nextPrimaryRaw
        ? parseString(requireRecord(nextPrimaryRaw).document_id)
        : null;

      await this.pool.query(
        `DELETE FROM document_stack_members m
         USING document_duplicate_stacks s
         WHERE m.document_id = $1 AND m.stack_id = s.id AND s.user_id = $2`,
        [documentId, userId]
      );

      if (nextPrimary) {
        await this.pool.query(
          `UPDATE document_stack_members m SET role = 'primary'
           FROM document_duplicate_stacks s
           WHERE m.stack_id = s.id AND s.user_id = $2 AND m.stack_id = $1 AND m.document_id = $3`,
          [member.stackId, userId, nextPrimary]
        );
      } else {
        await this.pool.query(
          `DELETE FROM document_duplicate_stacks WHERE id = $1 AND user_id = $2`,
          [member.stackId, userId]
        );
      }
      return;
    }

    await this.pool.query(
      `DELETE FROM document_stack_members m
       USING document_duplicate_stacks s
       WHERE m.document_id = $1 AND m.stack_id = s.id AND s.user_id = $2`,
      [documentId, userId]
    );
    await this.dissolveStackIfOnlyPrimary(member.stackId, userId);
    await this.cleanupEmptyStack(member.stackId, userId);
  }

  async handleDocumentDeleted(userId: string, documentId: string): Promise<void> {
    await this.removeMember(userId, documentId);
  }

  private async stackHasPendingReview(userId: string, stackId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1
       FROM document_stack_members a
       JOIN document_stack_members b ON b.stack_id = a.stack_id AND b.document_id <> a.document_id
       JOIN document_duplicate_candidates c
         ON c.user_id = $1
        AND c.dismissed = false
        AND (
          (c.document_id = a.document_id AND c.candidate_document_id = b.document_id)
          OR (c.document_id = b.document_id AND c.candidate_document_id = a.document_id)
        )
       INNER JOIN document_duplicate_stacks s ON s.id = a.stack_id
       WHERE a.stack_id = $2 AND s.user_id = $1
       LIMIT 1`,
      [userId, stackId]
    );
    return result.rows.length > 0;
  }

  private async pickPrimaryDocumentId(
    userId: string,
    documentIdA: string,
    documentIdB: string
  ): Promise<string> {
    const result = await this.pool.query(
      `SELECT id FROM documents
       WHERE user_id = $1 AND id = ANY($2::uuid[])
       ORDER BY
         CASE status
           WHEN 'ready' THEN 0
           WHEN 'extracting' THEN 1
           WHEN 'queued' THEN 2
           WHEN 'uploaded' THEN 3
           WHEN 'failed' THEN 4
           ELSE 5
         END,
         created_at ASC
       LIMIT 1`,
      [userId, [documentIdA, documentIdB]]
    );
    const raw: unknown = result.rows[0];
    if (!raw) return documentIdA;
    return parseString(requireRecord(raw).id);
  }

  private async createStack(userId: string): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO document_duplicate_stacks (user_id) VALUES ($1) RETURNING id`,
      [userId]
    );
    return parseString(requireRecord(result.rows[0]).id);
  }

  private async insertMember(
    stackId: string,
    userId: string,
    documentId: string,
    role: 'primary' | 'version'
  ): Promise<void> {
    const existing = await this.getMembership(documentId, userId);
    if (existing) return;

    if (role === 'primary') {
      const hasPrimary = await this.pool.query(
        `SELECT 1 FROM document_stack_members m
         INNER JOIN document_duplicate_stacks s ON s.id = m.stack_id
         WHERE m.stack_id = $1 AND s.user_id = $2 AND m.role = 'primary'`,
        [stackId, userId]
      );
      if (hasPrimary.rows.length > 0) {
        role = 'version';
      }
    }

    await this.pool.query(
      `INSERT INTO document_stack_members (stack_id, document_id, role)
       SELECT $1, $2, $3
       FROM document_duplicate_stacks s
       WHERE s.id = $1 AND s.user_id = $4
       ON CONFLICT (document_id) DO NOTHING`,
      [stackId, documentId, role, userId]
    );
    await this.pool.query(`UPDATE document_duplicate_stacks SET updated_at = now() WHERE id = $1`, [
      stackId,
    ]);
  }

  private async mergeStacks(userId: string, stackIdA: string, stackIdB: string): Promise<void> {
    const primaryA = await this.findPrimaryId(stackIdA, userId);
    const primaryB = await this.findPrimaryId(stackIdB, userId);
    if (!primaryA || !primaryB) return;

    const keepStackId = stackIdA;
    const dropStackId = stackIdB;
    let keepPrimaryId = primaryA;

    const olderPrimary = await this.pickPrimaryDocumentId(userId, primaryA, primaryB);
    if (olderPrimary !== primaryA) {
      keepPrimaryId = olderPrimary;
    }

    await this.pool.query(
      `UPDATE document_stack_members m SET role = 'version'
       FROM document_duplicate_stacks s
       WHERE m.stack_id = s.id AND s.user_id = $2 AND m.stack_id = $1 AND m.role = 'primary'`,
      [keepStackId, userId]
    );
    await this.pool.query(
      `UPDATE document_stack_members m SET role = 'version'
       FROM document_duplicate_stacks s
       WHERE m.stack_id = s.id AND s.user_id = $2 AND m.stack_id = $1`,
      [dropStackId, userId]
    );

    await this.pool.query(
      `UPDATE document_stack_members m SET stack_id = $1
       FROM document_duplicate_stacks s
       WHERE m.stack_id = s.id AND s.user_id = $3 AND m.stack_id = $2`,
      [keepStackId, dropStackId, userId]
    );

    await this.pool.query(
      `UPDATE document_stack_members m SET role = 'primary'
       FROM document_duplicate_stacks s
       WHERE m.stack_id = s.id AND s.user_id = $2 AND m.stack_id = $1 AND m.document_id = $3`,
      [keepStackId, userId, keepPrimaryId]
    );

    await this.pool.query(`DELETE FROM document_duplicate_stacks WHERE id = $1 AND user_id = $2`, [
      dropStackId,
      userId,
    ]);
  }

  private async findPrimaryId(stackId: string, userId: string): Promise<string | null> {
    const result = await this.pool.query(
      `SELECT m.document_id FROM document_stack_members m
       INNER JOIN document_duplicate_stacks s ON s.id = m.stack_id
       WHERE m.stack_id = $1 AND s.user_id = $2 AND m.role = 'primary'`,
      [stackId, userId]
    );
    const raw: unknown = result.rows[0];
    return raw ? parseString(requireRecord(raw).document_id) : null;
  }

  private async dissolveStackIfOnlyPrimary(stackId: string, userId: string): Promise<void> {
    const result = await this.pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE role = 'version')::int AS version_count
       FROM document_stack_members m
       INNER JOIN document_duplicate_stacks s ON s.id = m.stack_id
       WHERE m.stack_id = $1 AND s.user_id = $2`,
      [stackId, userId]
    );
    const row = requireRecord(result.rows[0]);
    const total = parseNumber(row.total);
    const versionCount = parseNumber(row.version_count);
    if (total === 1 && versionCount === 0) {
      await this.pool.query(
        `DELETE FROM document_stack_members m
         USING document_duplicate_stacks s
         WHERE m.stack_id = s.id AND s.user_id = $2 AND m.stack_id = $1`,
        [stackId, userId]
      );
      await this.pool.query(
        `DELETE FROM document_duplicate_stacks WHERE id = $1 AND user_id = $2`,
        [stackId, userId]
      );
    }
  }

  private async cleanupEmptyStack(stackId: string, userId: string): Promise<void> {
    const result = await this.pool.query(
      `SELECT 1 FROM document_stack_members m
       INNER JOIN document_duplicate_stacks s ON s.id = m.stack_id
       WHERE m.stack_id = $1 AND s.user_id = $2 LIMIT 1`,
      [stackId, userId]
    );
    if (result.rows.length === 0) {
      await this.pool.query(
        `DELETE FROM document_duplicate_stacks WHERE id = $1 AND user_id = $2`,
        [stackId, userId]
      );
    }
  }
}
