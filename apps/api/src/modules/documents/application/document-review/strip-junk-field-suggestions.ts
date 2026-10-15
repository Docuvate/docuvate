// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type ExtractedField, parseSuggestionStorageKey } from '@docuvate/contracts';

import { isJunkReviewFieldSuggestion } from './review-field-junk-filter.js';

export function stripJunkHeuristicFieldSuggestions(
  fields: ExtractedField[],
  context: { title: string; filename: string; firstLine?: string | null }
): ExtractedField[] {
  return fields.filter((field) => {
    const semantic = parseSuggestionStorageKey(field.key);
    if (!semantic) {
      return true;
    }
    return !isJunkReviewFieldSuggestion({
      key: field.key,
      value: field.value,
      title: context.title,
      filename: context.filename,
      firstLine: context.firstLine,
    });
  });
}
