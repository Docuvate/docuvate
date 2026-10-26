// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';

import { normalizeSearchText } from '../domain/normalize-search-text.js';
import {
  CHUNK_VOCAB_GATE_MIN_LENGTH,
  isFourDigitYearToken,
} from '../domain/vocabulary-gate.js';
import { CHUNK_FTS_MIN_TERM_LENGTH } from './global-search-chunk-fts.query.js';

export { CHUNK_VOCAB_GATE_MIN_LENGTH, isFourDigitYearToken } from '../domain/vocabulary-gate.js';

export function requiresVocabularyForChunkFts(term: string): boolean {
  if (term.length < CHUNK_FTS_MIN_TERM_LENGTH) {
    return false;
  }
  if (isFourDigitYearToken(term)) {
    return false;
  }
  return term.length >= CHUNK_VOCAB_GATE_MIN_LENGTH;
}

async function vocabularyPresence(
  pool: pg.Pool,
  userId: string,
  gatedTerms: string[]
): Promise<Set<string>> {
  if (gatedTerms.length === 0) {
    return new Set();
  }
  const vocab = await pool.query<{ term: string }>(
    `SELECT term FROM search_vocabulary_terms WHERE user_id = $1 AND term = ANY($2::text[])`,
    [userId, gatedTerms]
  );
  return new Set(vocab.rows.map((row) => row.term));
}

export async function filterChunkFtsTermsByVocabulary(
  pool: pg.Pool,
  userId: string,
  terms: string[]
): Promise<string[]> {
  const allowed: string[] = [];
  const gated: string[] = [];
  for (const term of terms) {
    if (requiresVocabularyForChunkFts(term)) {
      gated.push(term);
    } else {
      allowed.push(term);
    }
  }
  const present = await vocabularyPresence(pool, userId, gated);
  for (const term of gated) {
    if (present.has(term)) {
      allowed.push(term);
    }
  }
  return allowed;
}

export async function filterLexicalTermsByVocabularyGate(
  pool: pg.Pool,
  userId: string,
  terms: string[]
): Promise<string[]> {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const term of terms) {
    if (!seen.has(term)) {
      seen.add(term);
      unique.push(term);
    }
  }
  const allowed: string[] = [];
  const gated: string[] = [];
  for (const term of unique) {
    if (requiresVocabularyForChunkFts(term)) {
      gated.push(term);
    } else {
      allowed.push(term);
    }
  }
  const present = await vocabularyPresence(pool, userId, gated);
  for (const term of gated) {
    if (present.has(term)) {
      allowed.push(term);
    }
  }
  return allowed;
}

/** Returns a probe suitable for title/label/folder trigram search, or null when vocabulary-gated out. */
export async function resolveVocabularyGatedNameProbe(
  pool: pg.Pool,
  userId: string,
  probe: string
): Promise<string | null> {
  const normalized = normalizeSearchText(probe);
  if (normalized.length < 3) {
    return null;
  }
  if (!requiresVocabularyForChunkFts(normalized)) {
    return probe;
  }
  const present = await vocabularyPresence(pool, userId, [normalized]);
  return present.has(normalized) ? probe : null;
}
