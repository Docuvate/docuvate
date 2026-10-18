// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { SavedDocumentViewFieldFilterDto } from '@docuvate/contracts';

import { isRecord } from '../../../shared/infrastructure/database/row-parse.js';

export function parseFieldFiltersQuery(raw: string | undefined): SavedDocumentViewFieldFilterDto[] | undefined {
  if (raw == null || raw.trim() === '') return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!Array.isArray(parsed)) return undefined;
  const items: SavedDocumentViewFieldFilterDto[] = [];
  for (const entry of parsed) {
    if (!isRecord(entry)) continue;
    const fieldKey = typeof entry.fieldKey === 'string' ? entry.fieldKey.trim() : '';
    const valueText = typeof entry.valueText === 'string' ? entry.valueText.trim() : '';
    if (!fieldKey || !valueText) continue;
    items.push({ fieldKey, valueText });
  }
  return items.length > 0 ? items : undefined;
}
