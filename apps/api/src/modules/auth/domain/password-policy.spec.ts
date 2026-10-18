// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  evaluatePassword,
  PASSWORD_LENGTH_MAX_BOUND,
  passwordPolicyViolations,
} from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

describe('password policy evaluation', () => {
  it('lists only min length in default policy', () => {
    const policy = {
      minLength: 12,
      requireLower: false,
      requireUpper: false,
      requireDigit: false,
      requireSymbol: false,
      checkBreached: false,
    };
    expect(evaluatePassword(policy, '').map((row) => row.rule)).toEqual(['minLength']);
  });

  it('adds max length row only when exceeded', () => {
    const policy = {
      minLength: 8,
      requireLower: false,
      requireUpper: false,
      requireDigit: false,
      requireSymbol: false,
      checkBreached: false,
    };
    const long = 'x'.repeat(PASSWORD_LENGTH_MAX_BOUND + 1);
    expect(evaluatePassword(policy, long).some((row) => row.rule === 'maxLength')).toBe(true);
    expect(evaluatePassword(policy, 'short').some((row) => row.rule === 'maxLength')).toBe(false);
  });

  it('detects composition violations', () => {
    const policy = {
      minLength: 8,
      requireLower: true,
      requireUpper: true,
      requireDigit: true,
      requireSymbol: true,
      checkBreached: false,
    };
    const violations = passwordPolicyViolations(policy, 'abcdefgh');
    expect(violations).toContain('requireUpper');
    expect(violations).toContain('requireDigit');
    expect(violations).toContain('requireSymbol');
  });
});
