// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  calibratedLabelSuggestionConfidence,
  labelSuggestionMeetsBatchThreshold,
  type LabelSuggestionScoreRow,
} from '../../../labels/domain/label-suggestion-calibrated-confidence.js';
import {
  tagPairConflicts,
} from '../../../labels/infrastructure/pg-label-co-occurrence.repository.js';
import type { TagSuggestionEntity } from '../../../taxonomy/domain/taxonomy.entity.js';

export function rankLabelSuggestionsForReview(
  suggestions: TagSuggestionEntity[],
  fineThresholds: ReadonlyMap<string, number>
): TagSuggestionEntity[] {
  const ranked: LabelSuggestionScoreRow[] = suggestions.map((row) => ({
    tagId: row.tag.id,
    rawConfidence: row.confidence ?? 0,
  }));
  return [...suggestions].sort((a, b) => {
    const aScore = calibratedLabelSuggestionConfidence({
      tagId: a.tag.id,
      rawConfidence: a.confidence ?? 0,
      ranked,
      fineThresholds,
    });
    const bScore = calibratedLabelSuggestionConfidence({
      tagId: b.tag.id,
      rawConfidence: b.confidence ?? 0,
      ranked,
      fineThresholds,
    });
    return bScore - aScore;
  });
}

export function selectAcceptableLabelSuggestions(input: {
  suggestions: TagSuggestionEntity[];
  assignedTagIds: ReadonlySet<string>;
  exclusivePairs: ReadonlySet<string>;
  fineThresholds: ReadonlyMap<string, number>;
  minConfidence: number;
}): TagSuggestionEntity[] {
  const ranked = rankLabelSuggestionsForReview(input.suggestions, input.fineThresholds);
  const accepted: TagSuggestionEntity[] = [];
  const occupied = new Set(input.assignedTagIds);

  for (const suggestion of ranked) {
    if (occupied.has(suggestion.tag.id)) {
      continue;
    }
    if (
      input.minConfidence > 0 &&
      !labelSuggestionMeetsBatchThreshold({
        tagId: suggestion.tag.id,
        rawConfidence: suggestion.confidence ?? 0,
        minConfidence: input.minConfidence,
        ranked: ranked.map((row) => ({
          tagId: row.tag.id,
          rawConfidence: row.confidence ?? 0,
        })),
        fineThresholds: input.fineThresholds,
      })
    ) {
      continue;
    }
    let conflicts = false;
    for (const tagId of occupied) {
      if (tagPairConflicts(tagId, suggestion.tag.id, input.exclusivePairs)) {
        conflicts = true;
        break;
      }
    }
    if (conflicts) {
      continue;
    }
    accepted.push(suggestion);
    occupied.add(suggestion.tag.id);
  }
  return accepted;
}
