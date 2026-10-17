// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  buildExcludedDocumentsByLabelKey,
  filterClusterDocumentIds,
} from './label-recommendation-cluster-exclusions.js';

describe('label-recommendation-cluster-exclusions', () => {
  it('filters document ids excluded for a label key', () => {
    const excluded = buildExcludedDocumentsByLabelKey([
      { labelKey: 'rechnung', documentId: 'doc-b' },
    ]);
    const filtered = filterClusterDocumentIds(
      ['doc-a', 'doc-b', 'doc-c'],
      'rechnung',
      excluded
    );
    expect(filtered).toEqual(['doc-a', 'doc-c']);
  });

  it('returns all ids when no exclusions exist', () => {
    const filtered = filterClusterDocumentIds(['doc-a'], 'rechnung', new Map());
    expect(filtered).toEqual(['doc-a']);
  });
});
