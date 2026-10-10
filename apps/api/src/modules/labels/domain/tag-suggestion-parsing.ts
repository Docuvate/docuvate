// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  TagSuggestionDecisionTier,
  TagSuggestionSource,
} from '../../taxonomy/domain/taxonomy.entity.js';

const TAG_SUGGESTION_SOURCES: readonly TagSuggestionSource[] = [
  'rule',
  'embedding',
  'embedding_density',
];

const TAG_SUGGESTION_DECISION_TIERS: readonly TagSuggestionDecisionTier[] = [
  'auto_apply',
  'confirm',
  'none',
];

export function parseTagSuggestionSource(value: unknown): TagSuggestionSource {
  if (typeof value !== 'string') {
    return 'rule';
  }
  for (const source of TAG_SUGGESTION_SOURCES) {
    if (source === value) {
      return source;
    }
  }
  return 'rule';
}

export function parseTagSuggestionDecisionTier(
  value: unknown
): TagSuggestionDecisionTier | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  for (const tier of TAG_SUGGESTION_DECISION_TIERS) {
    if (tier === value) {
      return tier;
    }
  }
  return undefined;
}
