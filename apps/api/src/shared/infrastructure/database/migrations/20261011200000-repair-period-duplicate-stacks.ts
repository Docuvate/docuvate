// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  collectReportingYears,
  type DuplicateDocumentSignals,
  evaluateEmbeddingDuplicateCandidate,
  reportingYearsConflict,
} from '@docuvate/contracts';
import type { MigrationInterface, QueryRunner } from 'typeorm';

import {
  parseOptionalDate,
  parseOptionalString,
  parseString,
  requireRecord,
} from '../row-parse.js';

const GATE_CONFIG = {
  pageCountMinDifference: 3,
  pageCountGateMaxSimilarity: 0.95,
};

async function queryRows(
  queryRunner: QueryRunner,
  sql: string,
  params?: unknown[]
): Promise<unknown[]> {
  const rows: unknown = await queryRunner.query(sql, params);
  return Array.isArray(rows) ? rows.map((row: unknown) => row) : [];
}

function signalsFromRow(
  row: Record<string, unknown>,
  documentId: string
): DuplicateDocumentSignals {
  const documentDate = parseOptionalDate(row.document_date);
  return {
    documentId,
    filename: parseString(row.filename),
    title: parseString(row.title),
    documentDateYear: documentDate ? documentDate.getUTCFullYear() : null,
    extractedTextSample: (parseOptionalString(row.extracted_text) ?? '').slice(0, 8000),
    pageCount: null,
  };
}

function pairShouldNotBeStacked(
  left: DuplicateDocumentSignals,
  right: DuplicateDocumentSignals
): boolean {
  const leftYears = collectReportingYears(left);
  const rightYears = collectReportingYears(right);
  if (reportingYearsConflict(leftYears, rightYears)) {
    return true;
  }
  const gate = evaluateEmbeddingDuplicateCandidate(left, right, 0.99, GATE_CONFIG);
  return !gate.accept;
}

export class RepairPeriodDuplicateStacks20261011200000 implements MigrationInterface {
  name = 'RepairPeriodDuplicateStacks20261011200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRows(
      queryRunner,
      `SELECT c.user_id,
              c.document_id,
              c.candidate_document_id,
              da.filename AS filename_a,
              da.title AS title_a,
              da.document_date AS date_a,
              da.extracted_text AS text_a,
              db.filename AS filename_b,
              db.title AS title_b,
              db.document_date AS date_b,
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
      const left = signalsFromRow(
        {
          filename: row.filename_a,
          title: row.title_a,
          document_date: row.date_a,
          extracted_text: row.text_a,
        },
        docA
      );
      const right = signalsFromRow(
        {
          filename: row.filename_b,
          title: row.title_b,
          document_date: row.date_b,
          extracted_text: row.text_b,
        },
        docB
      );

      if (!pairShouldNotBeStacked(left, right)) {
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

  public down(): Promise<void> {
    // Irreversible data repair: split stacks are not re-created.
    return Promise.resolve();
  }
}
