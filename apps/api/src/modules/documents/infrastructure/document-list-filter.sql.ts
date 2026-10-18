// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery } from '@docuvate/contracts';

export interface DocumentListFilterSql {
  whereSql: string;
  params: unknown[];
}

/** Shared WHERE clause for document library queries (primary rows only). */
export function buildDocumentListFilterSql(
  userId: string,
  filters: DocumentListQuery = {}
): DocumentListFilterSql {
  const conditions: string[] = [
    'd.user_id = $1',
    `NOT EXISTS (
        SELECT 1 FROM document_stack_members m
        WHERE m.document_id = d.id AND m.role = 'version'
      )`,
  ];
  const params: unknown[] = [userId];
  let paramIndex = 2;

  if (filters.status) {
    conditions.push(`d.status = $${String(paramIndex)}`);
    paramIndex += 1;
    params.push(filters.status);
  }
  const fieldFilters =
    filters.fieldFilters?.filter(
      (entry) => entry.fieldKey.trim().length > 0 && entry.valueText.trim().length > 0
    ) ?? [];
  if (fieldFilters.length === 0) {
    const fieldFilterKey = filters.fieldFilterKey ?? filters.recognizedFieldKey;
    const fieldFilterValue = filters.fieldFilterValue ?? filters.recognizedFieldValue;
    if (fieldFilterKey?.trim() && fieldFilterValue?.trim()) {
      fieldFilters.push({
        fieldKey: fieldFilterKey.trim(),
        valueText: fieldFilterValue.trim(),
      });
    }
  }
  for (const entry of fieldFilters) {
    const storageKey = entry.fieldKey.trim().startsWith('global:')
      ? entry.fieldKey.trim()
      : `global:${entry.fieldKey.trim()}`;
    conditions.push(
      `EXISTS (
          SELECT 1 FROM document_field_values dfv
          WHERE dfv.document_id = d.id
            AND dfv.field_storage_key = $${String(paramIndex)}
            AND dfv.value_text = $${String(paramIndex + 1)}
        )`
    );
    paramIndex += 2;
    params.push(storageKey, entry.valueText.trim());
  }
  if (filters.correspondentId) {
    conditions.push(`d.correspondent_id = $${String(paramIndex)}`);
    paramIndex += 1;
    params.push(filters.correspondentId);
  }
  const tagIds = filters.tagIds?.filter(Boolean) ?? (filters.tagId ? [filters.tagId] : undefined);
  if (tagIds?.length) {
    for (const tagId of tagIds) {
      conditions.push(
        `EXISTS (SELECT 1 FROM document_tags dtf WHERE dtf.document_id = d.id AND dtf.tag_id = $${String(paramIndex)})`
      );
      paramIndex += 1;
      params.push(tagId);
    }
  }
  if (filters.inbox) {
    conditions.push(
      `EXISTS (
          SELECT 1 FROM document_tags dit
          JOIN tags it ON it.id = dit.tag_id
          WHERE dit.document_id = d.id AND it.is_inbox = true
        )`
    );
  }
  if (filters.withoutNonInboxLabel) {
    conditions.push(
      `NOT EXISTS (
          SELECT 1 FROM document_tags dtn
          JOIN tags nt ON nt.id = dtn.tag_id
          WHERE dtn.document_id = d.id AND nt.is_inbox = false
        )`
    );
  }
  if (filters.folderId) {
    conditions.push(`d.folder_id = $${String(paramIndex)}`);
    paramIndex += 1;
    params.push(filters.folderId);
  }
  if (filters.unfiled) {
    conditions.push(`d.folder_id IS NULL`);
  }
  if (filters.q?.trim()) {
    const qParam = String(paramIndex);
    conditions.push(
      `(d.filename ILIKE '%' || $${qParam} || '%'
          OR d.title ILIKE '%' || $${qParam} || '%'
          OR d.search_vector @@ plainto_tsquery('simple', $${qParam}))`
    );
    params.push(filters.q.trim());
    paramIndex += 1;
  }
  if (filters.documentDateFrom) {
    conditions.push(`d.document_date >= $${String(paramIndex)}::date`);
    paramIndex += 1;
    params.push(filters.documentDateFrom);
  }
  if (filters.documentDateTo) {
    conditions.push(`d.document_date <= $${String(paramIndex)}::date`);
    paramIndex += 1;
    params.push(filters.documentDateTo);
  }

  return { whereSql: conditions.join(' AND '), params };
}
