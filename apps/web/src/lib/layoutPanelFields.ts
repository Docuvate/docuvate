// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

import { isPlausibleVendorSuggestion } from './vendorSuggestionFilter';

const VENDOR_KEYS = new Set(['vendor', 'absender', 'global:vendor', 'suggestion:vendor']);

/** Last-resort UI filter when stored extraction predates worker fixes. */
export function fieldsForLayoutPanel(fields: ExtractedField[]): ExtractedField[] {
  return fields.filter((field) => {
    const key = field.key.trim().toLowerCase();
    if (VENDOR_KEYS.has(key) || key === 'absender') {
      return isPlausibleVendorSuggestion(field.value);
    }
    return true;
  });
}
