// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import {
  EXACT_FACT_MATCH_CALIBRATION,
  EXACT_FACT_MATCH_DEFAULT_THRESHOLD,
  exactFactMatchScoreTokens,
  fellegiSunterExactFactMatchScore,
} from '@docuvate/contracts';

import type { ParsedExactFactQuery } from './exact-fact-query.types.js';
import type { ExactFactRow } from './exact-fact-row.js';

export function resolveExactFactMatchScoreThreshold(
  tenantOverride: number | null | undefined
): number {
  if (tenantOverride != null && Number.isFinite(tenantOverride)) {
    return Math.min(Math.max(tenantOverride, 0), 1);
  }
  const envRaw = process.env['DOCUVATE_EXACT_FACT_MATCH_THRESHOLD'];
  if (envRaw) {
    const parsed = Number.parseFloat(envRaw);
    if (Number.isFinite(parsed)) {
      return Math.min(Math.max(parsed, 0), 1);
    }
  }
  return EXACT_FACT_MATCH_DEFAULT_THRESHOLD;
}

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
