// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

const MISASSIGNED_VENDOR_KEYS = new Set(['vendor', 'absender', 'sender']);
const MAX_VENDOR_VALUE_LEN = 80;
const BANNER_LINE_RE = /synthetic layout regression document/i;

/** Drop obvious mis-extractions (long banner lines mapped to Absender/vendor). */
export function fieldsForLayoutPanel(fields: ExtractedField[]): ExtractedField[] {
  return fields.filter((field) => {
    const key = field.key.trim().toLowerCase();
    const value = field.value.trim();
    if (BANNER_LINE_RE.test(value)) return false;
    if (!MISASSIGNED_VENDOR_KEYS.has(key)) return true;
    if (value.length > MAX_VENDOR_VALUE_LEN) return false;
    return true;
  });
}
