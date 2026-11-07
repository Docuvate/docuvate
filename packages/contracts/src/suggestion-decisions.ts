// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { parseSuggestionStorageKey } from './global-heuristic-fields.js';
import { normalizeSuggestionDecisionValue } from './document-regions.js';

/**
 * Review-row key for a durable suggestion decision.
 *
 * Strips a `suggestion:` storage prefix so the queue, the workbench and the
 * stored decision name the same row. It does not rewrite bare keys to
 * `global:` and it does not collapse semantic aliases (`vendor` / `absender`):
 * those are different fields, and rejecting one must not hide the other.
 */
export function suggestionDecisionFieldKey(raw: string): string {
  const trimmed = raw.trim();
  const fromSuggestion = parseSuggestionStorageKey(trimmed);
  if (fromSuggestion) {
    return fromSuggestion;
  }
  return trimmed;
}

/**
 * Spellings that identify one review row: the decision key, a legacy `global:`
 * prefix written before decisions used the review-row key, and the original
 * storage key when it differs only by `suggestion:`.
 */
export function suggestionRejectIdentityKeys(fieldKey: string): readonly string[] {
  const trimmed = fieldKey.trim();
  const canonical = suggestionDecisionFieldKey(trimmed);
  const keys = new Set<string>([canonical, trimmed]);
  if (!canonical.includes(':')) {
    keys.add(`global:${canonical}`);
    return [...keys];
  }
  if (canonical.startsWith('global:')) {
    const bare = canonical.slice('global:'.length);
    if (bare.length > 0 && !bare.includes(':')) {
      keys.add(bare);
    }
  }
  return [...keys];
}

/**
 * True when a stored decision is the same review row as `rowFieldKey` + `rowValue`.
 * Same normalized value on a different field key is a different occurrence.
 */
export function suggestionRejectMatches(
  storedFieldKey: string,
  storedValueNormalized: string,
  rowFieldKey: string,
  rowValue: string
): boolean {
  if (storedValueNormalized !== normalizeSuggestionDecisionValue(rowValue)) {
    return false;
  }
  const accepted = new Set(suggestionRejectIdentityKeys(rowFieldKey));
  return accepted.has(storedFieldKey);
}
