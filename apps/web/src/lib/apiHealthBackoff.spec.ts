// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { apiHealthBackoffSeconds } from './apiHealthBackoff';

describe('apiHealthBackoffSeconds', () => {
  it('starts at one second and doubles with a cap', () => {
    expect(apiHealthBackoffSeconds(1)).toBe(1);
    expect(apiHealthBackoffSeconds(2)).toBe(2);
    expect(apiHealthBackoffSeconds(3)).toBe(4);
    expect(apiHealthBackoffSeconds(6)).toBe(30);
    expect(apiHealthBackoffSeconds(10)).toBe(30);
  });
});
