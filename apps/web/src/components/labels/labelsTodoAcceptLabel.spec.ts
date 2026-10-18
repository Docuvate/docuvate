// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelRecommendationDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { clusterAcceptDisabled } from './labelsTodoAcceptLabel';

describe('labelsTodoAcceptLabel', () => {
  const item: LabelRecommendationDto = {
    id: 'new:cluster:test',
    kind: 'new',
    score: 0.8,
    reason: 'test',
    sampleDocuments: [{ id: 'a', title: 'A', filename: 'a.pdf' }, { id: 'b', title: 'B', filename: 'b.pdf' }],
  };

  it('disables accept when no cluster documents are selected', () => {
    expect(clusterAcceptDisabled(item, 0, 2)).toBe(true);
    expect(clusterAcceptDisabled(item, 1, 2)).toBe(false);
  });

  it('treats assign recommendations with multiple documents like cluster picks', () => {
    const assignItem: LabelRecommendationDto = {
      ...item,
      id: 'assign:d1:tag',
      kind: 'assign',
      tagId: 'tag',
    };
    expect(clusterAcceptDisabled(assignItem, 0, 2)).toBe(true);
    expect(clusterAcceptDisabled(assignItem, 2, 2)).toBe(false);
  });
});
