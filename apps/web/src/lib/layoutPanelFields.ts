// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

const BANNER_LINE_RE = /synthetic layout regression document/i;
const HEADING_VENDOR_VALUE_RE =
  /^(?:QUERFORMAT[\s\-A-Z0-9]*FIXTURE|VERTRAGSUEBERSICHT|ANHANG\s+PREISLISTE)/i;

/** Last-resort UI filter when stored extraction predates worker fixes. */
export function fieldsForLayoutPanel(fields: ExtractedField[]): ExtractedField[] {
  return fields.filter((field) => {
    const value = field.value.trim();
    if (BANNER_LINE_RE.test(value)) return false;
    if (HEADING_VENDOR_VALUE_RE.test(value)) return false;
    return true;
  });
}
