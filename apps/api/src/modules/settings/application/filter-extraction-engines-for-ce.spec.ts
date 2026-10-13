// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import { filterExtractionEnginesForCe } from './filter-extraction-engines-for-ce.js';

describe('filterExtractionEnginesForCe', () => {
  const engines = [
    { id: 'pipeline', label: 'Pipeline', description: '' },
    { id: 'paddle', label: 'Paddle', description: '' },
  ];

  afterEach(() => {
    delete process.env.DOCUVATE_CE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS;
  });

  it('returns only pipeline when experimental research is off', () => {
    expect(filterExtractionEnginesForCe(engines)).toEqual([engines[0]]);
  });

  it('returns full list when experimental research is on', () => {
    process.env.DOCUVATE_CE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS = 'true';
    expect(filterExtractionEnginesForCe(engines)).toEqual(engines);
  });
});
