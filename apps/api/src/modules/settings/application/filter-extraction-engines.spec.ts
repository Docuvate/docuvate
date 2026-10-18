// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { filterExtractionEngines } from './filter-extraction-engines.js';

const engines = [
  { id: 'pipeline', label: 'Pipeline', description: 'Default pipeline' },
  { id: 'arena', label: 'Arena', description: 'Arena compare' },
];

describe('filterExtractionEngines', () => {
  it('returns only pipeline when experimental research models are off', () => {
    expect(
      filterExtractionEngines(engines, {
        layoutReconstructionCompare: false,
        sourceConnectors: false,
        experimentalResearchModels: false,
        exactAnswers: false,
        smartDuplicates: false,
        answerAbstention: false,
        learnedValueTypes: true,
        layoutKeyValueRoles: false,
        localChatModel: false,
      })
    ).toEqual([{ id: 'pipeline', label: 'Pipeline', description: 'Default pipeline' }]);
  });

  it('returns all engines when experimental research models are on', () => {
    expect(
      filterExtractionEngines(engines, {
        layoutReconstructionCompare: false,
        sourceConnectors: false,
        experimentalResearchModels: true,
        exactAnswers: false,
        smartDuplicates: false,
        answerAbstention: false,
        learnedValueTypes: true,
        layoutKeyValueRoles: false,
        localChatModel: false,
      })
    ).toEqual(engines);
  });
});
