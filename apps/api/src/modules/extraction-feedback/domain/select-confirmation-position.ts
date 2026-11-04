// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { canonicalFieldName } from '@docuvate/contracts';

import type {
  ExtractedFactAnchor,
  FieldFeedbackPosition,
  FieldRegionAnchor,
} from '../../../shared/domain/ports.js';
import { extractionFieldValuesEquivalent } from './extraction-field-value-equivalence.js';

type Bbox = NonNullable<FieldFeedbackPosition['bbox']>;

function normalizedBbox(fact: ExtractedFactAnchor): Bbox | null {
  if (!fact.bbox) {
    return null;
  }
  const box = {
    x0: fact.bbox.x,
    y0: fact.bbox.y,
    x1: fact.bbox.x + fact.bbox.width,
    y1: fact.bbox.y + fact.bbox.height,
  };
  const inside = 0 <= box.x0 && box.x0 < box.x1 && box.x1 <= 1;
  return inside && 0 <= box.y0 && box.y0 < box.y1 && box.y1 <= 1 ? box : null;
}

function factPosition(fact: ExtractedFactAnchor): FieldFeedbackPosition | null {
  const bbox = normalizedBbox(fact);
  const chars =
    fact.docCharStart !== null && fact.docCharEnd !== null && fact.docCharStart < fact.docCharEnd
      ? { docCharStart: fact.docCharStart, docCharEnd: fact.docCharEnd }
      : null;
  if (fact.page === null || fact.page < 1 || (!bbox && !chars)) {
    return null;
  }
  return {
    source: 'model_fact',
    page: fact.page,
    docCharStart: chars?.docCharStart ?? null,
    docCharEnd: chars?.docCharEnd ?? null,
    bbox,
    blockIndexes: [],
  };
}

/**
 * Position for a confirmed value, taken only from stored provenance: the user's own
 * field region, else the single model fact for this field whose value equals the
 * confirmed one. Ambiguous or missing provenance yields null; text is never searched.
 */
export function selectConfirmationPosition(input: {
  fieldKey: string;
  value: string;
  regions: readonly FieldRegionAnchor[];
  facts: readonly ExtractedFactAnchor[];
}): FieldFeedbackPosition | null {
  const name = canonicalFieldName(input.fieldKey);
  const regions = input.regions.filter((region) => canonicalFieldName(region.fieldKey) === name);
  if (regions.length > 1) {
    return null;
  }
  const region = regions.at(0);
  if (region) {
    return {
      source: 'user_region',
      page: region.page,
      docCharStart: null,
      docCharEnd: null,
      bbox: region.bbox,
      blockIndexes: region.blockIndexes,
    };
  }
  const facts = input.facts.filter(
    (fact) =>
      canonicalFieldName(fact.predicateKey) === name &&
      extractionFieldValuesEquivalent(input.fieldKey, fact.value, input.value)
  );
  const fact = facts.at(0);
  return fact && facts.length === 1 ? factPosition(fact) : null;
}
