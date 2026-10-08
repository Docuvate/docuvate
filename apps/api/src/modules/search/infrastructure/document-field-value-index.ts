import type pg from 'pg';
import type { CustomFieldType, ExtractedField } from '@docuvate/contracts';
import { parseGlobalFieldStorageKey } from '../../recognized-fields/domain/recognized-field.entity.js';
import { parseLabelFieldStorageKey } from '../../labels/domain/tag-custom-field.entity.js';
import { normalizeFieldValue } from '../domain/normalize-field-value.js';

export interface FieldDefinitionLookup {
  storageKey: string;
  label: string;
  fieldType: CustomFieldType;
}

function defaultLabelFromKey(storageKey: string): string {
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
  pool: pg.Pool,
  userId: string
): Promise<Map<string, FieldDefinitionLookup>> {
  const map = new Map<string, FieldDefinitionLookup>();
  const global = await pool.query<{
    field_key: string;
    label: string;
    field_type: string;
  }>(
    `SELECT field_key, label, field_type FROM recognized_field_definitions WHERE user_id = $1`,
    [userId]
  );
  for (const row of global.rows) {
    const storageKey = `global:${row.field_key}`;
    map.set(storageKey, {
      storageKey,
      label: row.label,
      fieldType: row.field_type as CustomFieldType,
    });
  }
  const labelFields = await pool.query<{
    tag_id: string;
    field_key: string;
    label: string;
    field_type: string;
  }>(
    `SELECT tag_id, field_key, label, field_type FROM tag_custom_field_definitions WHERE user_id = $1`,
    [userId]
  );
  for (const row of labelFields.rows) {
    const storageKey = `label:${row.tag_id}:${row.field_key}`;
    map.set(storageKey, {
      storageKey,
      label: row.label,
      fieldType: row.field_type as CustomFieldType,
    });
  }
  return map;
}

export async function upsertDocumentFieldValues(
  pool: pg.Pool,
  userId: string,
  documentId: string,
  fields: ExtractedField[],
  defs: Map<string, FieldDefinitionLookup>
): Promise<void> {
  await pool.query(`DELETE FROM document_field_values WHERE document_id = $1`, [documentId]);
  for (const field of fields) {
    if (!field.value?.trim()) continue;
    const meta = defs.get(field.key) ?? {
      storageKey: field.key,
      label: defaultLabelFromKey(field.key),
      fieldType: 'text' as CustomFieldType,
    };
    const normalized = normalizeFieldValue(field.value, meta.fieldType);
    await pool.query(
      `INSERT INTO document_field_values (
         document_id, user_id, field_storage_key, field_label, field_type,
         value_text, value_text_norm, value_numeric, value_date, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::date, now())`,
      [
        documentId,
        userId,
        meta.storageKey,
        meta.label,
        meta.fieldType,
        normalized.displayValue,
        normalized.textNorm,
        normalized.numeric,
        normalized.dateIso,
      ]
    );
  }
}

function parseExtractedFieldsPayload(payload: unknown): ExtractedField[] {
  if (Array.isArray(payload)) {
    return payload as ExtractedField[];
  }
  if (payload && typeof payload === 'object') {
    const raw = (payload as { fields?: unknown }).fields;
    if (Array.isArray(raw)) {
      return raw as ExtractedField[];
    }
  }
  return [];
}

/** One-time / versioned migration backfill from `documents.extracted_fields` JSONB. */
export async function backfillDocumentFieldValuesFromJsonb(pool: pg.Pool): Promise<number> {
  const docs = await pool.query<{ id: string; user_id: string; extracted_fields: unknown }>(
    `SELECT d.id, d.user_id, d.extracted_fields
     FROM documents d
     WHERE d.extracted_fields IS NOT NULL
       AND jsonb_array_length(COALESCE(d.extracted_fields->'fields', '[]'::jsonb)) > 0`
  );
  let documents = 0;
  for (const row of docs.rows) {
    const fields = parseExtractedFieldsPayload(row.extracted_fields);
    if (fields.length === 0) continue;
    const defs = await loadFieldDefinitionLookup(pool, row.user_id);
    await upsertDocumentFieldValues(pool, row.user_id, row.id, fields, defs);
    documents += 1;
  }
  return documents;
}
