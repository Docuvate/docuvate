import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import type {
  DuplicateStackMemberRow,
  DuplicateStackRepository,
  DuplicateStackSummary,
} from '../../../shared/domain/ports.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

type Membership = { stackId: string; role: 'primary' | 'version' };

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
    for (const row of result.rows) {
      await this.linkPair(
        userId,
        String(row['document_id']),
        String(row['candidate_document_id'])
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
      `SELECT stack_id, role FROM document_stack_members
       WHERE document_id = $1 AND user_id = $2`,
      [documentId, userId]
    );
    const row = result.rows[0];
    if (!row) return null;
    const role = String(row['role']);
    if (role !== 'primary' && role !== 'version') return null;
    return { stackId: String(row['stack_id']), role };
  }

  async listMembers(stackId: string, userId: string): Promise<DuplicateStackMemberRow[]> {
    const result = await this.pool.query(
      `SELECT m.stack_id, m.document_id, m.role, m.joined_at,
              d.title, d.filename, d.status, d.mime_type
       FROM document_stack_members m
       JOIN documents d ON d.id = m.document_id
       WHERE m.stack_id = $1 AND m.user_id = $2
       ORDER BY CASE WHEN m.role = 'primary' THEN 0 ELSE 1 END, m.joined_at ASC`,
      [stackId, userId]
    );
    return result.rows.map((row) => ({
      stackId: String(row['stack_id']),
      documentId: String(row['document_id']),
      role: String(row['role']) as 'primary' | 'version',
      title: String(row['title']),
      filename: String(row['filename']),
      status: row['status'] as DuplicateStackMemberRow['status'],
      mimeType: String(row['mime_type']),
      joinedAt: new Date(String(row['joined_at'])),
    }));
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
       JOIN document_stack_members m ON m.stack_id = m_primary.stack_id
       WHERE m_primary.user_id = $1
         AND m_primary.role = 'primary'
         AND m_primary.document_id = ANY($2::uuid[])
       GROUP BY m_primary.document_id, m.stack_id`,
      [userId, documentIds]
    );

    for (const row of counts.rows) {
      const primaryId = String(row['primary_id']);
      const stackId = String(row['stack_id']);
      const versionCount = Number(row['version_count']);
      const pending = await this.stackHasPendingReview(userId, stackId);
      summaries.set(primaryId, { stackId, versionCount, pendingReview: pending });
    }
    return summaries;
  }

  async setPrimary(userId: string, stackId: string, documentId: string): Promise<void> {
    const member = await this.getMembership(documentId, userId);
    if (!member || member.stackId !== stackId) {
      throw new Error('Document is not in this stack');
    }

    await this.pool.query(
      `UPDATE document_stack_members SET role = 'version'
       WHERE stack_id = $1 AND user_id = $2 AND role = 'primary'`,
      [stackId, userId]
    );
    await this.pool.query(
      `UPDATE document_stack_members SET role = 'primary'
       WHERE stack_id = $1 AND user_id = $2 AND document_id = $3`,
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
        `SELECT document_id FROM document_stack_members
         WHERE stack_id = $1 AND user_id = $2 AND role = 'version'
         ORDER BY joined_at ASC LIMIT 1`,
        [member.stackId, userId]
      );
      const nextPrimary = versions.rows[0]
        ? String(versions.rows[0]['document_id'])
        : null;

      await this.pool.query(
        `DELETE FROM document_stack_members WHERE document_id = $1 AND user_id = $2`,
        [documentId, userId]
      );

      if (nextPrimary) {
        await this.pool.query(
          `UPDATE document_stack_members SET role = 'primary'
           WHERE stack_id = $1 AND user_id = $2 AND document_id = $3`,
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
      `DELETE FROM document_stack_members WHERE document_id = $1 AND user_id = $2`,
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
       WHERE a.stack_id = $2 AND a.user_id = $1
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
    return String(result.rows[0]?.['id'] ?? documentIdA);
  }

  private async createStack(userId: string): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO document_duplicate_stacks (user_id) VALUES ($1) RETURNING id`,
      [userId]
    );
    return String(result.rows[0]['id']);
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
        `SELECT 1 FROM document_stack_members
         WHERE stack_id = $1 AND user_id = $2 AND role = 'primary'`,
        [stackId, userId]
      );
      if (hasPrimary.rows.length > 0) {
        role = 'version';
      }
    }

    await this.pool.query(
      `INSERT INTO document_stack_members (stack_id, document_id, user_id, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (document_id) DO NOTHING`,
      [stackId, documentId, userId, role]
    );
    await this.pool.query(
      `UPDATE document_duplicate_stacks SET updated_at = now() WHERE id = $1`,
      [stackId]
    );
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
      `UPDATE document_stack_members SET role = 'version'
       WHERE stack_id = $1 AND user_id = $2 AND role = 'primary'`,
      [keepStackId, userId]
    );
    await this.pool.query(
      `UPDATE document_stack_members SET role = 'version'
       WHERE stack_id = $1 AND user_id = $2`,
      [dropStackId, userId]
    );

    await this.pool.query(
      `UPDATE document_stack_members SET stack_id = $1
       WHERE stack_id = $2 AND user_id = $3`,
      [keepStackId, dropStackId, userId]
    );

    await this.pool.query(
      `UPDATE document_stack_members SET role = 'primary'
       WHERE stack_id = $1 AND user_id = $2 AND document_id = $3`,
      [keepStackId, userId, keepPrimaryId]
    );

    await this.pool.query(
      `DELETE FROM document_duplicate_stacks WHERE id = $1 AND user_id = $2`,
      [dropStackId, userId]
    );
  }

  private async findPrimaryId(stackId: string, userId: string): Promise<string | null> {
    const result = await this.pool.query(
      `SELECT document_id FROM document_stack_members
       WHERE stack_id = $1 AND user_id = $2 AND role = 'primary'`,
      [stackId, userId]
    );
    return result.rows[0] ? String(result.rows[0]['document_id']) : null;
  }

  private async dissolveStackIfOnlyPrimary(stackId: string, userId: string): Promise<void> {
    const result = await this.pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE role = 'version')::int AS version_count
       FROM document_stack_members
       WHERE stack_id = $1 AND user_id = $2`,
      [stackId, userId]
    );
    const total = Number(result.rows[0]?.['total'] ?? 0);
    const versionCount = Number(result.rows[0]?.['version_count'] ?? 0);
    if (total === 1 && versionCount === 0) {
      await this.pool.query(
        `DELETE FROM document_stack_members WHERE stack_id = $1 AND user_id = $2`,
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
      `SELECT 1 FROM document_stack_members WHERE stack_id = $1 AND user_id = $2 LIMIT 1`,
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
