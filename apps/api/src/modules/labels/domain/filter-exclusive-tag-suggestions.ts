// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  tagPairConflicts,
} from '../infrastructure/pg-label-co-occurrence.repository.js';
import type { TagSuggestionEntity } from '../../taxonomy/domain/taxonomy.entity.js';

export function filterExclusiveTagSuggestions(input: {
  suggestions: readonly TagSuggestionEntity[];
  assignedTagIds: ReadonlySet<string>;
  exclusivePairs: ReadonlySet<string>;
}): TagSuggestionEntity[] {
  const occupied = new Set(input.assignedTagIds);
  return input.suggestions.filter((suggestion) => {
    if (occupied.has(suggestion.tag.id)) {
      return false;
    }
    for (const tagId of occupied) {
      if (tagPairConflicts(tagId, suggestion.tag.id, input.exclusivePairs)) {
        return false;
      }
    }
    return true;
  });
}

export function tagIdConflictsWithAssigned(
  tagId: string,
  assignedTagIds: ReadonlySet<string>,
  exclusivePairs: ReadonlySet<string>
): boolean {
  for (const assigned of assignedTagIds) {
    if (tagPairConflicts(assigned, tagId, exclusivePairs)) {
      return true;
    }
  }
  return false;
}
