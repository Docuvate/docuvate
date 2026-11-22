// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { formatAppBuildLabel, shortBuildSha } from './appBuildLabel';

describe('appBuildLabel', () => {
  it('formats semver and short sha', () => {
    expect(formatAppBuildLabel('0.1.1', 'c5d0ad23abcdef')).toBe('0.1.1+c5d0ad23');
  });

  it('falls back to dev when sha missing', () => {
    expect(shortBuildSha('')).toBe('dev');
    expect(shortBuildSha('unknown')).toBe('dev');
    expect(formatAppBuildLabel('0.1.1', 'unknown')).toBe('0.1.1+dev');
  });
});
