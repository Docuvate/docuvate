// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import {
  EXACT_FACT_MATCH_CALIBRATION,
  exactFactMatchScoreTokens,
  fellegiSunterExactFactMatchScore,
} from '@docuvate/contracts';

import type { ParsedExactFactQuery } from './exact-fact-query.types.js';
import type { ExactFactRow } from './exact-fact-row.js';

export function bestExactFactMatchScore(
  query: ParsedExactFactQuery,
  rows: readonly ExactFactRow[]
): number {
  const scoreTokens = exactFactMatchScoreTokens(query.predicateTokens, query.yearHint);
  if (scoreTokens.length === 0) {
    return rows.length > 0 ? 1 : 0;
  }
  if (rows.length === 0) {
    return 0;
  }
  let best = 0;
  for (const row of rows) {
    const score = fellegiSunterExactFactMatchScore(
      scoreTokens,
      row.predicateKey,
      row.valueText,
      EXACT_FACT_MATCH_CALIBRATION.weights
    );
    if (score > best) {
      best = score;
    }
  }
  return best;
}

export function passesExactFactMatchGate(input: {
  query: ParsedExactFactQuery;
  rows: readonly ExactFactRow[];
  threshold: number;
}): boolean {
  return bestExactFactMatchScore(input.query, input.rows) >= input.threshold;
}
