// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Matches API `normalizeKey` (lowercase slug, max 64 chars). */
export function deriveKeyFromLabel(label: string): string {
  const trimmed = label.trim().toLowerCase();
  return trimmed
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

export function isValidFieldKey(key: string): boolean {
  return deriveKeyFromLabel(key) === key.trim().toLowerCase() && key.trim().length > 0;
}
