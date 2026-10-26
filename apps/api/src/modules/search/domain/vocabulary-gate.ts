// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Glued compounds longer than this must exist in search_vocabulary_terms before chunk/document FTS. */
export const CHUNK_VOCAB_GATE_MIN_LENGTH = 8;

export function isFourDigitYearToken(term: string): boolean {
  if (term.length !== 4) {
    return false;
  }
  for (const ch of term) {
    if (ch < '0' || ch > '9') {
      return false;
    }
  }
  return true;
}
