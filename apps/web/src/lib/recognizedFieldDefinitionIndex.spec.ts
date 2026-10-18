// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  buildRecognizedFieldDefinitionIndex,
  suggestionMatchesPersistedDefinition,
} from './recognizedFieldDefinitionIndex';

describe('recognizedFieldDefinitionIndex', () => {
  const catalog = [
    {
      id: 'def-date',
      key: 'global:date',
      label: 'Datum',
      fieldType: 'date' as const,
      sortOrder: 0,
      extractForAllDocuments: true,
      gateLabelIds: [],
      gateLabelMatch: 'all' as const,
      minLabelConfidence: null,
      confidenceGateEnabled: null,
    },
  ];

  it('dedupes suggestions by definition id across alias keys', () => {
    const index = buildRecognizedFieldDefinitionIndex(catalog);
    const persisted = new Set(['def-date']);
    expect(
      suggestionMatchesPersistedDefinition('global:datum', persisted, index)
    ).toBe(true);
    expect(
      suggestionMatchesPersistedDefinition('global:amount', persisted, index)
    ).toBe(false);
  });
});
