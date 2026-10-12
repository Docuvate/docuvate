// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { describe, expect, it } from 'vitest';

import {
  firstPageBelowSsimFloor,
  reconstructionQualityTone,
} from './layoutReconstructionQuality';

describe('layoutReconstructionQuality', () => {
  it('returns review when any page is below the floor', () => {
    const metrics = new Map([
      [
        1,
        {
          pageNumber: 1,
          ssim: 0.99,
          inkDeviation: null,
          pageReliable: true,
          errorCode: null,
        },
      ],
      [
        2,
        {
          pageNumber: 2,
          ssim: 0.88,
          inkDeviation: null,
          pageReliable: true,
          errorCode: null,
        },
      ],
    ]);
    expect(reconstructionQualityTone(metrics, 0.96)).toBe('review');
    expect(firstPageBelowSsimFloor(metrics, 0.96)).toBe(2);
  });

  it('returns good when all scored pages meet the floor', () => {
    const metrics = new Map([
      [
        1,
        {
          pageNumber: 1,
          ssim: 0.97,
          inkDeviation: null,
          pageReliable: true,
          errorCode: null,
        },
      ],
    ]);
    expect(reconstructionQualityTone(metrics, 0.96)).toBe('good');
  });
});
