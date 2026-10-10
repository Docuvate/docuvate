// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type CustomFieldType,
  dedupeExtractedFields,
  type ExtractedField,
} from '@docuvate/contracts';

import {
  parseEnum,
  parseOptionalNumber,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { parseLabelFieldStorageKey } from '../../labels/domain/tag-custom-field.entity.js';
import { parseGlobalFieldStorageKey } from '../../recognized-fields/domain/recognized-field.entity.js';
import { normalizeFieldValue } from '../domain/normalize-field-value.js';

const CUSTOM_FIELD_TYPES: readonly CustomFieldType[] = ['text', 'date', 'number', 'currency'];

/** Minimal query surface shared by `pg.Pool`, `pg.PoolClient` and migration adapters. */
export interface SqlQueryable {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export interface FieldDefinitionLookup {
  storageKey: string;
  label: string;
  fieldType: CustomFieldType;
}

/** Display label for a storage key without a catalog entry (`global:due_date` -> `Due Date`). */
export function defaultFieldLabel(storageKey: string): string {
  const global = parseGlobalFieldStorageKey(storageKey);
  if (global) {
    return global.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const label = parseLabelFieldStorageKey(storageKey);
  if (label) {
    return label.fieldKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return storageKey;
}

export async function loadFieldDefinitionLookup(
  db: SqlQueryable,
  userId: string
): Promise<Map<string, FieldDefinitionLookup>> {
  const map = new Map<string, FieldDefinitionLookup>();
  const global = await db.query(
    `SELECT field_key, label, field_type FROM recognized_field_definitions WHERE user_id = $1`,
    [userId]
  );
  for (const row of global.rows) {
    const record = requireRecord(row);
    const storageKey = `global:${parseString(record.field_key)}`;
    map.set(storageKey, {
      storageKey,
      label: parseString(record.label),
      fieldType: parseEnum(record.field_type, CUSTOM_FIELD_TYPES, 'text'),
    });
  }
  const labelFields = await db.query(
    `SELECT f.tag_id, f.field_key, f.label, f.field_type
     FROM tag_custom_field_definitions f
     INNER JOIN tags t ON t.id = f.tag_id
     WHERE t.user_id = $1`,
    [userId]
  );
  for (const row of labelFields.rows) {
    const record = requireRecord(row);
    const storageKey = `label:${parseString(record.tag_id)}:${parseString(record.field_key)}`;
    map.set(storageKey, {
      storageKey,
      label: parseString(record.label),
      fieldType: parseEnum(record.field_type, CUSTOM_FIELD_TYPES, 'text'),
    });
  }
  return map;
}

/** Storage key as persisted: label-scoped fields always carry their label in the key. */
export function fieldStorageKey(field: ExtractedField): string {
  const key = field.key.trim();
  if (field.tagId && !key.startsWith('label:')) {
    return `label:${field.tagId}:${key}`;
  }
  return key;
}

export interface DocumentFieldValueRow {
  fieldStorageKey: string;
  valueText: string;
  confidence: number | null;
  valueTextNorm: string | null;
  valueNumeric: number | null;
  valueDate: string | null;
}

/**
 * Raw value plus the derived search columns: text fields get a normalized text for trigram search,
 * number/currency fields a numeric value, date fields an ISO date (ADR 016).
 */
export function toDocumentFieldValueRow(
  storageKey: string,
  value: string,
  confidence: number | null,
  defs: Map<string, FieldDefinitionLookup>
): DocumentFieldValueRow {
  const fieldType = defs.get(storageKey)?.fieldType ?? 'text';
  const normalized = normalizeFieldValue(value, fieldType);
  return {
    fieldStorageKey: storageKey,
    valueText: value,
    confidence,
    valueTextNorm: fieldType === 'text' ? normalized.textNorm : null,
    valueNumeric: normalized.numeric,
    valueDate: normalized.dateIso,
  };
}

async function insertFieldValueRow(
  db: SqlQueryable,
  documentId: string,
  row: DocumentFieldValueRow
): Promise<void> {
  await db.query(
    `INSERT INTO document_field_values (
       document_id, field_storage_key, value_text, confidence,
       value_text_norm, value_numeric, value_date
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::date)
     ON CONFLICT (document_id, field_storage_key) DO UPDATE SET
       value_text = EXCLUDED.value_text,
       confidence = EXCLUDED.confidence,
       value_text_norm = EXCLUDED.value_text_norm,
       value_numeric = EXCLUDED.value_numeric,
       value_date = EXCLUDED.value_date`,
    [
      documentId,
      row.fieldStorageKey,
      row.valueText,
      row.confidence,
      row.valueTextNorm,
      row.valueNumeric,
      row.valueDate,
    ]
  );
}

/** Single writer for a document's field values (extraction result or user edit). */
export async function replaceDocumentFieldValues(
  db: SqlQueryable,
  documentId: string,
  userId: string,
  fields: ExtractedField[]
): Promise<void> {
  const defs = await loadFieldDefinitionLookup(db, userId);
  await db.query(`DELETE FROM document_field_values WHERE document_id = $1`, [documentId]);
  for (const field of dedupeExtractedFields(fields)) {
    const storageKey = fieldStorageKey(field);
    if (!storageKey) continue;
    await insertFieldValueRow(
      db,
      documentId,
      toDocumentFieldValueRow(storageKey, field.value, field.confidence ?? null, defs)
    );
  }
}

function rowToExtractedField(row: Record<string, unknown>): ExtractedField {
  const key = parseString(row.field_storage_key);
  const field: ExtractedField = { key, value: parseString(row.value_text) };
  const confidence = parseOptionalNumber(row.confidence);
  if (confidence != null) {
    field.confidence = confidence;
  }
  const label = parseLabelFieldStorageKey(key);
  if (label) {
    field.tagId = label.tagId;
  }
  return field;
}

/** Field values for many documents in one query, ordered by storage key. */
export async function loadDocumentFieldValues(
  db: SqlQueryable,
  documentIds: string[]
): Promise<Map<string, ExtractedField[]>> {
  const out = new Map<string, ExtractedField[]>();
  if (documentIds.length === 0) return out;
  const result = await db.query(
    `SELECT document_id, field_storage_key, value_text, confidence
     FROM document_field_values
     WHERE document_id = ANY($1::uuid[])
     ORDER BY document_id, field_storage_key`,
    [documentIds]
  );
  for (const row of result.rows) {
    const documentId = String(row.document_id);
    const list = out.get(documentId) ?? [];
    list.push(rowToExtractedField(row));
    out.set(documentId, list);
  }
  return out;
}
