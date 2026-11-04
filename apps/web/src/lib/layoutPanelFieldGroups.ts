// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

/** Show the field filter once the panel lists more fields than fit on a small screen. */
export const LAYOUT_FIELD_FILTER_MIN_FIELDS = 8;

interface LayoutPanelFieldGroups {
  found: ExtractedField[];
  missing: ExtractedField[];
}

/**
 * Splits panel fields into recognized values and expected-but-empty fields, keeping the
 * original order inside each group. `query` filters by the visible field name (case-insensitive).
 */
export function groupLayoutPanelFields(
  fields: readonly ExtractedField[],
  query: string,
  fieldLabelForKey: (key: string) => string
): LayoutPanelFieldGroups {
  const needle = query.trim().toLocaleLowerCase();
  const found: ExtractedField[] = [];
  const missing: ExtractedField[] = [];
  for (const field of fields) {
    if (needle && !fieldLabelForKey(field.key).toLocaleLowerCase().includes(needle)) {
      continue;
    }
    if (field.value.trim().length > 0) {
      found.push(field);
    } else {
      missing.push(field);
    }
  }
  return { found, missing };
}
