// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Match worker `normalize_predicate_key` (casefold + collapsed whitespace). */
export function normalizePredicateKey(raw: string): string {
  const collapsed = raw.trim().split(/\s+/).filter((part) => part.length > 0).join(' ');
  return collapsed.toLocaleLowerCase('de-DE');
}
