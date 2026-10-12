// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  buildDuplicateFeatureVector,
  decideDuplicatePair,
  DEFAULT_DUPLICATE_CLASSIFIER_MODEL,
  type DuplicateCompareDocumentInput,
} from '@docuvate/contracts';
import type { MigrationInterface, QueryRunner } from 'typeorm';

import {
  parseOptionalString,
  parseString,
  requireRecord,
} from '../row-parse.js';

async function queryRows(
  queryRunner: QueryRunner,
  sql: string,
  params?: unknown[]
): Promise<unknown[]> {
  const rows: unknown = await queryRunner.query(sql, params);
  return Array.isArray(rows) ? rows.map((row: unknown) => row) : [];
}

function pairShouldBeUnstacked(
  left: DuplicateCompareDocumentInput,
  right: DuplicateCompareDocumentInput,
  embeddingSimilarity: number
): boolean {
  const features = buildDuplicateFeatureVector({
    left,
    right,
    embeddingSimilarity,
    perceptualPageHashDistance: null,
  });
  const decision = decideDuplicatePair(DEFAULT_DUPLICATE_CLASSIFIER_MODEL, features, 0);
  return decision.decision !== 'auto_stack';
}

export class RepairPeriodDuplicateStacks20261011200000 implements MigrationInterface {
  name = 'RepairPeriodDuplicateStacks20261011200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRows(
      queryRunner,
      `SELECT c.user_id,
              c.document_id,
              c.candidate_document_id,
              c.similarity,
              da.filename AS filename_a,
              da.title AS title_a,
              da.extracted_text AS text_a,
              db.filename AS filename_b,
              db.title AS title_b,
              db.extracted_text AS text_b
       FROM document_duplicate_candidates c
       JOIN documents da ON da.id = c.document_id
       JOIN documents db ON db.id = c.candidate_document_id
       WHERE c.dismissed = false
         AND EXISTS (
           SELECT 1
           FROM document_stack_members ma
           JOIN document_stack_members mb
             ON ma.stack_id = mb.stack_id AND ma.document_id <> mb.document_id
           JOIN document_duplicate_stacks s ON s.id = ma.stack_id
           WHERE s.user_id = c.user_id
             AND ma.document_id = c.document_id
             AND mb.document_id = c.candidate_document_id
         )`
    );

    for (const raw of result) {
      const row = requireRecord(raw);
      const userId = parseString(row.user_id);
      const docA = parseString(row.document_id);
      const docB = parseString(row.candidate_document_id);
      const similarity = Number(row.similarity);
      const left: DuplicateCompareDocumentInput = {
        documentId: docA,
        filename: parseString(row.filename_a),
        title: parseString(row.title_a),
        extractedTextSample: (parseOptionalString(row.text_a) ?? '').slice(0, 8000),
        pageCount: null,
      };
      const right: DuplicateCompareDocumentInput = {
        documentId: docB,
        filename: parseString(row.filename_b),
        title: parseString(row.title_b),
        extractedTextSample: (parseOptionalString(row.text_b) ?? '').slice(0, 8000),
        pageCount: null,
      };

      if (!pairShouldBeUnstacked(left, right, similarity)) {
        continue;
      }

      await queryRunner.query(
        `UPDATE document_duplicate_candidates SET dismissed = true
         WHERE user_id = $1
           AND (
             (document_id = $2 AND candidate_document_id = $3)
             OR (document_id = $3 AND candidate_document_id = $2)
           )`,
        [userId, docA, docB]
      );

      for (const documentId of [docA, docB]) {
        const membership = await queryRows(
          queryRunner,
          `SELECT m.stack_id, m.role
           FROM document_stack_members m
           INNER JOIN document_duplicate_stacks s ON s.id = m.stack_id
           WHERE m.document_id = $1 AND s.user_id = $2`,
          [documentId, userId]
        );
        const memberRaw: unknown = membership[0];
        if (!memberRaw) continue;
        const member = requireRecord(memberRaw);
        if (parseString(member.role) !== 'version') continue;

        const stackId = parseString(member.stack_id);
        await queryRunner.query(
          `DELETE FROM document_stack_members m
           USING document_duplicate_stacks s
           WHERE m.document_id = $1 AND m.stack_id = s.id AND s.user_id = $2`,
          [documentId, userId]
        );
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
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- irreversible data repair
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Irreversible data repair.
  }
}
