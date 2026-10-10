// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/**
 * Merges PDF text-run spacing artifacts in table cells (subscripts, inline math fragments).
 */
export function formatLayoutTableCell(raw: string): string {
  let text = raw.replace(/\s+/g, ' ').trim();
  if (!text) {
    return '';
  }
  text = text.replace(/\s*,\s*/g, ', ');
  text = text.replace(/\s*;\s*/g, '; ');
  text = text.replace(/([μΣπλβα-ωA-Za-z0-9|)])\s+([a-z0-9]{1,2})(?=\s|$|[,.;])/g, '$1$2');
  text = text.replace(/\s{2,}/g, ' ');
  return text.trim();
}
