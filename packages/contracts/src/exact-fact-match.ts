// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Fellegi–Sunter field agreement weights (decoy-calibrated). */
export interface ExactFactFellegiSunterWeights {
  /** Token coverage in predicate ∪ value (query token appears in haystack). */
  coverage: { m: number; u: number };
  /** All query tokens appear as substrings in the normalized predicate key. */
  fullPredicate: { m: number; u: number };
}

export interface ExactFactMatchCalibration {
  weights: ExactFactFellegiSunterWeights;
  /** Default gate: reject matches with score strictly below this value. */
  defaultMatchScoreThreshold: number;
  /** Prior research gate (C5): 0% hallucination, ~0.60 count accuracy. */
  legacyMatchScoreThreshold: number;
}

const YEAR_TOKEN = /^(19|20)\d{2}$/;

/** Drop calendar-year tokens; year constraints are enforced in SQL, not the Fellegi–Sunter gate. */
export function exactFactMatchScoreTokens(
  predicateTokens: readonly string[],
  yearHint: number | null
): string[] {
  const yearText = yearHint != null ? String(yearHint) : null;
  const out: string[] = [];
  for (const token of predicateTokens) {
    if (yearText != null && token === yearText) {
      continue;
    }
    if (YEAR_TOKEN.test(token)) {
      continue;
    }
    out.push(token);
  }
  return out;
}

export function normalizeExactFactMatchText(raw: string): string {
  const collapsed = raw
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .join(' ');
  return collapsed.toLocaleLowerCase('de-DE');
}

function fieldLogOdds(agree: boolean, m: number, u: number): number {
  const mClamped = Math.min(Math.max(m, 1e-6), 1 - 1e-6);
  const uClamped = Math.min(Math.max(u, 1e-6), 1 - 1e-6);
  if (agree) {
    return Math.log(mClamped / uClamped);
  }
  return Math.log((1 - mClamped) / (1 - uClamped));
}

function wordSet(text: string): Set<string> {
  const words = normalizeExactFactMatchText(text).split(' ').filter((part) => part.length > 0);
  return new Set(words);
}

function queryTokenMatchesWords(token: string, words: ReadonlySet<string>): boolean {
  return token.length >= 2 && words.has(token);
}

export function exactFactTokenCoverage(
  queryTokens: readonly string[],
  predicateKey: string,
  valueText: string | null
): number {
  if (queryTokens.length === 0) {
    return 1;
  }
  const words = wordSet(`${predicateKey} ${valueText ?? ''}`);
  let matched = 0;
  for (const token of queryTokens) {
    if (queryTokenMatchesWords(token, words)) {
      matched += 1;
    }
  }
  return matched / queryTokens.length;
}

export function exactFactFullPredicateMatch(
  queryTokens: readonly string[],
  predicateKey: string
): boolean {
  if (queryTokens.length === 0) {
    return true;
  }
  const words = wordSet(predicateKey);
  for (const token of queryTokens) {
    if (!queryTokenMatchesWords(token, words)) {
      return false;
    }
  }
  return true;
}

export function sigmoidMatchScore(logOdds: number): number {
  if (logOdds >= 0) {
    const exp = Math.exp(-logOdds);
    return 1 / (1 + exp);
  }
  const exp = Math.exp(logOdds);
  return exp / (1 + exp);
}

/** Fellegi–Sunter weighted agreement score in (0, 1). */
export function fellegiSunterExactFactMatchScore(
  queryTokens: readonly string[],
  predicateKey: string,
  valueText: string | null,
  weights: ExactFactFellegiSunterWeights
): number {
  if (queryTokens.length === 0) {
    return 1;
  }
  const coverage = exactFactTokenCoverage(queryTokens, predicateKey, valueText);
  const agreeFull = exactFactFullPredicateMatch(queryTokens, predicateKey);
  let logOdds = 0;
  const covLogMatch = fieldLogOdds(true, weights.coverage.m, weights.coverage.u);
  const covLogNonMatch = fieldLogOdds(false, weights.coverage.m, weights.coverage.u);
  logOdds += coverage * covLogMatch + (1 - coverage) * covLogNonMatch;
  logOdds += fieldLogOdds(agreeFull, weights.fullPredicate.m, weights.fullPredicate.u);
  return sigmoidMatchScore(logOdds);
}

export interface ExactFactMatchLabeledSample {
  id: string;
  queryTokens: readonly string[];
  predicateKey: string;
  valueText: string | null;
  label: 'match' | 'decoy';
}

export function estimateFellegiSunterWeights(
  samples: readonly ExactFactMatchLabeledSample[]
): ExactFactFellegiSunterWeights {
  let matchCovAgree = 0;
  let matchCovTotal = 0;
  let decoyCovAgree = 0;
  let decoyCovTotal = 0;
  let matchFullAgree = 0;
  let matchFullTotal = 0;
  let decoyFullAgree = 0;
  let decoyFullTotal = 0;

  for (const sample of samples) {
    const coverage = exactFactTokenCoverage(
      sample.queryTokens,
      sample.predicateKey,
      sample.valueText
    );
    const agreeCoverage = coverage >= 0.5;
    const agreeFull = exactFactFullPredicateMatch(sample.queryTokens, sample.predicateKey);
    if (sample.label === 'match') {
      matchCovTotal += 1;
      if (agreeCoverage) matchCovAgree += 1;
      matchFullTotal += 1;
      if (agreeFull) matchFullAgree += 1;
    } else {
      decoyCovTotal += 1;
      if (agreeCoverage) decoyCovAgree += 1;
      decoyFullTotal += 1;
      if (agreeFull) decoyFullAgree += 1;
    }
  }

  const mCoverage = matchCovTotal === 0 ? 0.95 : matchCovAgree / matchCovTotal;
  const uCoverage = decoyCovTotal === 0 ? 0.08 : decoyCovAgree / decoyCovTotal;
  const mFull = matchFullTotal === 0 ? 0.88 : matchFullAgree / matchFullTotal;
  const uFull = decoyFullTotal === 0 ? 0.04 : decoyFullAgree / decoyFullTotal;

  return {
    coverage: { m: mCoverage, u: uCoverage },
    fullPredicate: { m: mFull, u: uFull },
  };
}

export interface ExactFactThresholdCalibrationResult {
  threshold: number;
  matchRecall: number;
  decoyPrecision: number;
}

/**
 * Pick the lowest threshold with perfect decoy precision (no decoy at/above threshold),
 * maximizing match recall — recalibrated from legacy strict gates that hurt count accuracy.
 */
export function calibrateExactFactMatchThreshold(
  samples: readonly ExactFactMatchLabeledSample[],
  weights: ExactFactFellegiSunterWeights
): ExactFactThresholdCalibrationResult {
  const scored = samples.map((sample) => ({
    label: sample.label,
    score: fellegiSunterExactFactMatchScore(
      sample.queryTokens,
      sample.predicateKey,
      sample.valueText,
      weights
    ),
  }));

  const uniqueThresholds = [...new Set(scored.map((row) => row.score))].sort((a, b) => a - b);
  const candidates = [0, ...uniqueThresholds, 1];

  let best: ExactFactThresholdCalibrationResult = {
    threshold: 1,
    matchRecall: 0,
    decoyPrecision: 1,
  };

  for (const threshold of candidates) {
    let tp = 0;
    let fn = 0;
    let fp = 0;
    for (const row of scored) {
      const accept = row.score >= threshold;
      if (row.label === 'match') {
        if (accept) tp += 1;
        else fn += 1;
      } else if (accept) {
        fp += 1;
      }
    }
    if (fp > 0) {
      continue;
    }
    const matchRecall = tp + fn === 0 ? 1 : tp / (tp + fn);
    if (matchRecall >= best.matchRecall - 1e-9) {
      if (matchRecall > best.matchRecall + 1e-9 || threshold < best.threshold) {
        best = { threshold, matchRecall, decoyPrecision: 1 };
      }
    }
  }

  return best;
}
