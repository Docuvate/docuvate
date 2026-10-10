// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  partitionRecognizedAndHeuristicSuggestions,
  type ExtractedField,
  type FieldSuggestionRow,
} from '@docuvate/contracts';

export function splitRecognizedFieldsAndSuggestions(
  fields: ExtractedField[],
  catalogKeys: ReadonlySet<string>
): { recognizedFields: ExtractedField[]; heuristicSuggestions: FieldSuggestionRow[] } {
  const { recognized, suggestions } = partitionRecognizedAndHeuristicSuggestions(
    fields,
    catalogKeys
  );
  return { recognizedFields: recognized, heuristicSuggestions: suggestions };
}
