// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { findFieldRegion } from './findFieldRegion';

const region: DocumentRegionDto = {
  id: 'region-vendor',
  documentId: 'doc-1',
  page: 1,
  shape: 'rect',
  role: 'field',
  x0: 0.1,
  y0: 0.1,
  x1: 0.4,
  y1: 0.2,
  irSha256: 'ir',
  needsReview: false,
  blockIndexes: [],
  field: { fieldKey: 'global:vendor', valueOverride: null },
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('findFieldRegion', () => {
  it('matches exact storage key', () => {
    expect(findFieldRegion('global:vendor', [region])?.id).toBe('region-vendor');
  });

  it('matches catalog absender to global:vendor region', () => {
    expect(findFieldRegion('absender', [region])?.id).toBe('region-vendor');
  });

  it('returns undefined when semantic does not match', () => {
    expect(findFieldRegion('datum', [region])).toBeUndefined();
  });
});
