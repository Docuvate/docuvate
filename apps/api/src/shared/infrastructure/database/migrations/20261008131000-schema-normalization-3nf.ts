// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { MigrationInterface, QueryRunner } from 'typeorm';
import {
  defaultFieldLabel,
  loadFieldDefinitionLookup,
  toDocumentFieldValueRow,
  type FieldDefinitionLookup,
  type SqlQueryable,
} from '../../../../modules/search/infrastructure/document-field-value-index.js';
import { normalizeFieldValue } from '../../../../modules/search/domain/normalize-field-value.js';

async function loadSql(name: string): Promise<string> {
  return readFile(join(__dirname, 'sql', name), 'utf8');
}

function queryable(queryRunner: QueryRunner): SqlQueryable {
  return {
    query: async (sql, params) => ({
      rows: (await queryRunner.query(sql, params)) as Array<Record<string, unknown>>,
    }),
  };
}

interface StoredFieldValue {
  documentId: string;
  userId: string;
  storageKey: string;
  valueText: string;
}

async function readStoredFieldValues(queryRunner: QueryRunner): Promise<StoredFieldValue[]> {
  const rows: Array<Record<string, unknown>> = await queryRunner.query(
    `SELECT v.document_id, d.user_id, v.field_storage_key, v.value_text
     FROM document_field_values v
     JOIN documents d ON d.id = v.document_id
     ORDER BY d.user_id, v.document_id, v.field_storage_key`
  );
  return rows.map((row) => ({
    documentId: String(row['document_id']),
    userId: String(row['user_id']),
    storageKey: String(row['field_storage_key']),
    valueText: String(row['value_text'] ?? ''),
  }));
}

async function loadDefinitionsByUser(
  queryRunner: QueryRunner,
  userIds: Iterable<string>
): Promise<Map<string, Map<string, FieldDefinitionLookup>>> {
  const db = queryable(queryRunner);
  const out = new Map<string, Map<string, FieldDefinitionLookup>>();
  for (const userId of userIds) {
    out.set(userId, await loadFieldDefinitionLookup(db, userId));
  }
  return out;
}

/**
 * Moves extraction fields and layout blocks out of `documents.extracted_fields` into
 * `document_field_values` / `document_extraction_blocks`, replaces JSONB id arrays with junction
 * tables and drops redundant `user_id` columns (ADR 015). Field values become the single source
 * of truth; their search columns (normalized text, numeric, date) are derived from the field
 * definition type and filled here, then kept current by the one writer in
 * `document-field-value-index.ts`.
 */
export class SchemaNormalization3nf20261008131000 implements MigrationInterface {
  name = 'SchemaNormalization3nf20261008131000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(await loadSql('schema-normalization-3nf-up.sql'));

    const stored = await readStoredFieldValues(queryRunner);
    const defsByUser = await loadDefinitionsByUser(
      queryRunner,
      new Set(stored.map((s) => s.userId))
    );
    for (const value of stored) {
      const row = toDocumentFieldValueRow(
        value.storageKey,
        value.valueText,
        null,
        defsByUser.get(value.userId) ?? new Map()
      );
      await queryRunner.query(
        `UPDATE document_field_values
         SET value_text_norm = $3, value_numeric = $4, value_date = $5::date
         WHERE document_id = $1 AND field_storage_key = $2`,
        [value.documentId, value.storageKey, row.valueTextNorm, row.valueNumeric, row.valueDate]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const stored = await readStoredFieldValues(queryRunner);
    const defsByUser = await loadDefinitionsByUser(
      queryRunner,
      new Set(stored.map((s) => s.userId))
    );

    await queryRunner.query(await loadSql('schema-normalization-3nf-down.sql'));

    // Rebuild the earlier search index shape (label and type copied per row, blanks skipped).
    for (const value of stored) {
      if (!value.valueText.trim()) continue;
      const def = defsByUser.get(value.userId)?.get(value.storageKey);
      const fieldType = def?.fieldType ?? 'text';
      const normalized = normalizeFieldValue(value.valueText, fieldType);
      await queryRunner.query(
        `INSERT INTO document_field_values (
           document_id, user_id, field_storage_key, field_label, field_type,
           value_text, value_text_norm, value_numeric, value_date, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, now())
         ON CONFLICT (document_id, field_storage_key) DO NOTHING`,
        [
          value.documentId,
          value.userId,
          value.storageKey,
          def?.label ?? defaultFieldLabel(value.storageKey),
          fieldType,
          normalized.displayValue,
          normalized.textNorm,
          normalized.numeric,
          normalized.dateIso,
        ]
      );
    }
  }
}
