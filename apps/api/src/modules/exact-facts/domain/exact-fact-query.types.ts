// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type ExactFactQueryKind = 'lookup' | 'sum_amounts' | 'count_facts';

export interface ParsedExactFactQuery {
  kind: ExactFactQueryKind;
  /** Normalized tokens that must match the stored predicate (all tokens). */
  predicateTokens: readonly string[];
  /** Four-digit calendar year filter when present in the user message. */
  yearHint: number | null;
}
