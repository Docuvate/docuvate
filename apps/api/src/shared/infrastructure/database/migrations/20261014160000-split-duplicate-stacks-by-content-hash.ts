// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import type { MigrationInterface, QueryRunner } from 'typeorm';

import {
  parseDate,
  parseOptionalString,
  parseString,
  requireRecord,
} from '../row-parse.js';

interface StackMemberRow {
  documentId: string;
  contentHash: string | null;
  createdAt: Date;
  role: 'primary' | 'version';
}

async function queryRows(
  queryRunner: QueryRunner,
  sql: string,
  params?: unknown[]
): Promise<unknown[]> {
  const rows: unknown = await queryRunner.query(sql, params);
  return Array.isArray(rows) ? rows.map((row: unknown) => row) : [];
}

function hashBucket(contentHash: string | null, documentId: string): string {
  if (contentHash != null && contentHash.trim() !== '') {
    return contentHash.trim();
  }
  return `__missing_hash__:${documentId}`;
}

function electPrimary(members: StackMemberRow[]): string {
  const sorted = [...members].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const newest = sorted[0];
  if (!newest) {
    throw new Error('empty member group');
  }
  return newest.documentId;
}

async function ensureRolesForGroup(
  queryRunner: QueryRunner,
  stackId: string,
  userId: string,
  members: StackMemberRow[]
): Promise<void> {
  if (members.length === 0) {
    return;
  }
  const primaryId = electPrimary(members);
  for (const member of members) {
    const role = member.documentId === primaryId ? 'primary' : 'version';
    await queryRunner.query(
      `UPDATE document_stack_members m
       SET role = $4
       FROM document_duplicate_stacks s
       WHERE m.stack_id = s.id
         AND s.id = $1
         AND s.user_id = $2
         AND m.document_id = $3`,
      [stackId, userId, member.documentId, role]
    );
  }
}

async function createStack(queryRunner: QueryRunner, userId: string): Promise<string> {
  const stackId = randomUUID();
  await queryRunner.query(
    `INSERT INTO document_duplicate_stacks (id, user_id, updated_at)
     VALUES ($1, $2, now())`,
    [stackId, userId]
  );
  return stackId;
}

async function moveMemberToStack(
  queryRunner: QueryRunner,
  userId: string,
  fromStackId: string,
  toStackId: string,
  documentId: string,
  role: 'primary' | 'version'
): Promise<void> {
  await queryRunner.query(
    `UPDATE document_stack_members m
     SET stack_id = $4, role = $5
     FROM document_duplicate_stacks s
     WHERE m.stack_id = s.id
       AND s.id = $1
       AND s.user_id = $2
       AND m.document_id = $3`,
    [fromStackId, userId, documentId, toStackId, role]
  );
}

export class SplitDuplicateStacksByContentHash20261014160000 implements MigrationInterface {
  name = 'SplitDuplicateStacksByContentHash20261014160000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const stacks = await queryRows(
      queryRunner,
      `SELECT s.id AS stack_id, s.user_id
       FROM document_duplicate_stacks s
       WHERE EXISTS (
         SELECT 1 FROM document_stack_members m WHERE m.stack_id = s.id
       )`
    );

    for (const rawStack of stacks) {
      const stackRow = requireRecord(rawStack);
      const stackId = parseString(stackRow.stack_id);
      const userId = parseString(stackRow.user_id);

      const memberRows = await queryRows(
        queryRunner,
        `SELECT m.document_id, m.role, d.content_hash, d.created_at
         FROM document_stack_members m
         JOIN documents d ON d.id = m.document_id
         JOIN document_duplicate_stacks s ON s.id = m.stack_id
         WHERE m.stack_id = $1 AND s.user_id = $2`,
        [stackId, userId]
      );

      const members: StackMemberRow[] = memberRows.map((raw) => {
        const row = requireRecord(raw);
        return {
          documentId: parseString(row.document_id),
          contentHash: parseOptionalString(row.content_hash),
          createdAt: parseDate(row.created_at),
          role: parseString(row.role) === 'primary' ? 'primary' : 'version',
        };
      });

      if (members.length === 0) {
        continue;
      }

      const groups = new Map<string, StackMemberRow[]>();
      for (const member of members) {
        const bucket = hashBucket(member.contentHash, member.documentId);
        const list = groups.get(bucket) ?? [];
        list.push(member);
        groups.set(bucket, list);
      }

      if (groups.size === 1) {
        const onlyGroup = [...groups.values()][0];
        if (onlyGroup && onlyGroup.length > 1) {
          await ensureRolesForGroup(queryRunner, stackId, userId, onlyGroup);
        } else if (onlyGroup && onlyGroup.length === 1) {
          await queryRunner.query(
            `DELETE FROM document_stack_members m
             USING document_duplicate_stacks s
             WHERE m.stack_id = s.id AND s.id = $1 AND s.user_id = $2`,
            [stackId, userId]
          );
        }
        continue;
      }

      const multiGroups = [...groups.entries()].filter(([, group]) => group.length > 1);
      const singletonDocumentIds = [...groups.entries()]
        .filter(([, group]) => group.length === 1)
        .flatMap(([, group]) => group.map((member) => member.documentId));

      const keepBucket =
        multiGroups.sort((a, b) => b[1].length - a[1].length)[0]?.[0] ??
        [...groups.keys()][0];
      const keepGroup = groups.get(keepBucket ?? '') ?? [];

      if (keepGroup.length > 1) {
        await ensureRolesForGroup(queryRunner, stackId, userId, keepGroup);
      } else {
        await queryRunner.query(
          `DELETE FROM document_stack_members m
           USING document_duplicate_stacks s
           WHERE m.stack_id = s.id AND s.id = $1 AND s.user_id = $2`,
          [stackId, userId]
        );
      }

      for (const [bucket, group] of groups.entries()) {
        if (bucket === keepBucket || group.length <= 1) {
          continue;
        }
        const newStackId = await createStack(queryRunner, userId);
        const primaryId = electPrimary(group);
        for (const member of group) {
          const role = member.documentId === primaryId ? 'primary' : 'version';
          await moveMemberToStack(
            queryRunner,
            userId,
            stackId,
            newStackId,
            member.documentId,
            role
          );
        }
      }

      for (const documentId of singletonDocumentIds) {
        await queryRunner.query(
          `DELETE FROM document_stack_members m
           USING document_duplicate_stacks s
           WHERE m.stack_id = s.id
             AND s.id = $1
             AND s.user_id = $2
             AND m.document_id = $3`,
          [stackId, userId, documentId]
        );
      }

      await queryRunner.query(
        `DELETE FROM document_duplicate_stacks s
         WHERE s.id = $1 AND s.user_id = $2
           AND NOT EXISTS (
             SELECT 1 FROM document_stack_members m WHERE m.stack_id = s.id
           )`,
        [stackId, userId]
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- irreversible data repair
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Irreversible data repair.
  }
}
