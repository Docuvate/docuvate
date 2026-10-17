// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { confidenceLevelFromPercent, confidenceLevelFromRatio } from './confidenceLevel';

describe('confidenceLevelFromPercent', () => {
  it('maps Figma thresholds', () => {
    expect(confidenceLevelFromPercent(97)).toBe('high');
    expect(confidenceLevelFromPercent(90)).toBe('high');
    expect(confidenceLevelFromPercent(89)).toBe('medium');
    expect(confidenceLevelFromPercent(60)).toBe('medium');
    expect(confidenceLevelFromPercent(59)).toBe('low');
  });
});

describe('confidenceLevelFromRatio', () => {
  it('converts ratio to percent bands', () => {
    expect(confidenceLevelFromRatio(0.94)).toBe('high');
    expect(confidenceLevelFromRatio(0.71)).toBe('medium');
  });
});
