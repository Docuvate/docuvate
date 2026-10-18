// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/**
 * Normalizes whitespace for layout table cells. Cell text is assembled in the worker
 * from PDF geometry; avoid client-side merging that can corrupt prose or math.
 */
export function formatLayoutTableCell(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}
