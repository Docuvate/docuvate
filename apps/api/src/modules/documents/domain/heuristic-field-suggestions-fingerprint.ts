// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const HEURISTIC_FIELD_SOURCE = join(
  __dirname,
  '../../../../../worker/src/docuvate_worker/infrastructure/ml/value_types/field_suggestions.py'
);

/** SHA-256 of learned/heuristic date/amount suggestion logic in the worker. */
export const HEURISTIC_FIELD_SUGGESTIONS_LOGIC_SHA256 =
  '3b6d82d72903b1c20e9d0ff5f5251917433c7a21ec635d9c2c4a2d4ab7bca237';

export function fingerprintToHeuristicFieldVersion(sha256Hex: string): number {
  return parseInt(sha256Hex.slice(0, 7), 16);
}

export const HEURISTIC_FIELD_EXTRACTOR_VERSION = fingerprintToHeuristicFieldVersion(
  HEURISTIC_FIELD_SUGGESTIONS_LOGIC_SHA256
);

export function readLiveHeuristicFieldSuggestionsSha256(): string {
  return createHash('sha256').update(readFileSync(HEURISTIC_FIELD_SOURCE)).digest('hex');
}
