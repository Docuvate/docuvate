// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CustomFieldType } from '@docuvate/contracts';

import { recordFromUnknown } from '../../../../../shared/infrastructure/database/row-parse.js';
import type { PaperlessCustomFieldDataType } from './paperless-api.types.js';

export type PaperlessOcrMode = 'keep_paperless' | 'rerun_docuvate';

export function mapPaperlessCustomFieldType(
  dataType: PaperlessCustomFieldDataType
): CustomFieldType {
  switch (dataType) {
    case 'date':
      return 'date';
    case 'integer':
    case 'float':
      return 'number';
    case 'monetary':
      return 'currency';
    case 'string':
    case 'url':
    case 'boolean':
    case 'select':
    case 'documentlink':
      return 'text';
    default: {
      const _exhaustive: never = dataType;
      return _exhaustive;
    }
  }
}

export function paperlessCustomFieldStorageKey(paperlessFieldId: number, slug: string): string {
  const safe = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_|_$/g, '');
  const fieldId = String(paperlessFieldId);
  const suffix = safe.length > 0 ? safe : `field_${fieldId}`;
  return `global:paperless_${fieldId}_${suffix}`;
}

function formatScalarPaperlessValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

export function formatPaperlessCustomFieldValue(
  dataType: PaperlessCustomFieldDataType,
  value: unknown
): string {
  if (value === null || value === undefined) {
    return '';
  }
  switch (dataType) {
    case 'boolean':
      return value === true || value === 'true' || value === 1 ? 'true' : 'false';
    case 'documentlink':
      if (Array.isArray(value)) {
        return value.map((entry) => formatScalarPaperlessValue(entry)).join(', ');
      }
      return formatScalarPaperlessValue(value);
    case 'monetary': {
      const row = recordFromUnknown(value);
      if (row && 'amount' in row) {
        return formatScalarPaperlessValue(row.amount);
      }
      return formatScalarPaperlessValue(value);
    }
    case 'date':
    case 'float':
    case 'integer':
    case 'select':
    case 'string':
    case 'url':
      return formatScalarPaperlessValue(value);
    default: {
      const _exhaustive: never = dataType;
      return _exhaustive;
    }
  }
}

export function mergePaperlessNotes(notes: PaperlessDocumentNotes): string | null {
  if (!notes) {
    return null;
  }
  if (typeof notes === 'string') {
    const trimmed = notes.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  const lines = notes
    .map((row) => row.note.trim())
    .filter((line) => line.length > 0);
  return lines.length > 0 ? lines.join('\n') : null;
}

type PaperlessDocumentNotes = { note: string }[] | string | null | undefined;

export function paperlessDocumentChecksum(doc: {
  checksum: string | null;
  modified: string;
}): string {
  const checksum = doc.checksum?.trim() ?? '';
  if (checksum.length > 0) {
    return checksum;
  }
  return doc.modified.trim();
}
