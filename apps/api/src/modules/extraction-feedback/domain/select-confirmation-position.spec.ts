// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { ExtractedFactAnchor, FieldRegionAnchor } from '../../../shared/domain/ports.js';
import { selectConfirmationPosition } from './select-confirmation-position.js';

const fact: ExtractedFactAnchor = {
  predicateKey: 'absender',
  value: 'Nordwind GmbH',
  page: 2,
  docCharStart: 10,
  docCharEnd: 23,
  bbox: { x: 0.1, y: 0.2, width: 0.25, height: 0.05 },
};

const region: FieldRegionAnchor = {
  fieldKey: 'global:absender',
  page: 1,
  bbox: { x0: 0.5, y0: 0.1, x1: 0.7, y1: 0.15 },
  blockIndexes: [3, 4],
};

describe('selectConfirmationPosition', () => {
  it('copies span and bbox from the matching model fact', () => {
    expect(
      selectConfirmationPosition({
        fieldKey: 'global:absender',
        value: 'Nordwind GmbH',
        regions: [],
        facts: [fact],
      })
    ).toEqual({
      source: 'model_fact',
      page: 2,
      docCharStart: 10,
      docCharEnd: 23,
      bbox: { x0: 0.1, y0: 0.2, x1: 0.35, y1: 0.25 },
      blockIndexes: [],
    });
  });

  it('prefers the user-marked region', () => {
    expect(
      selectConfirmationPosition({
        fieldKey: 'suggestion:absender',
        value: 'Nordwind GmbH',
        regions: [region],
        facts: [fact],
      })
    ).toEqual({
      source: 'user_region',
      page: 1,
      docCharStart: null,
      docCharEnd: null,
      bbox: region.bbox,
      blockIndexes: [3, 4],
    });
  });

  it('stores no position when the fact value differs', () => {
    expect(
      selectConfirmationPosition({
        fieldKey: 'global:absender',
        value: 'Südwind AG',
        regions: [],
        facts: [fact],
      })
    ).toBeNull();
  });

  it('stores no position when provenance is ambiguous', () => {
    expect(
      selectConfirmationPosition({
        fieldKey: 'global:absender',
        value: 'Nordwind GmbH',
        regions: [],
        facts: [fact, { ...fact, page: 3 }],
      })
    ).toBeNull();
    expect(
      selectConfirmationPosition({
        fieldKey: 'global:absender',
        value: 'Nordwind GmbH',
        regions: [region, { ...region, page: 2 }],
        facts: [fact],
      })
    ).toBeNull();
  });

  it('stores no position for a fact without page anchor', () => {
    expect(
      selectConfirmationPosition({
        fieldKey: 'global:absender',
        value: 'Nordwind GmbH',
        regions: [],
        facts: [{ ...fact, docCharStart: null, docCharEnd: null, bbox: null }],
      })
    ).toBeNull();
  });
});
