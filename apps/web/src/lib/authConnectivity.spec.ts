// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { beforeEach, describe, expect, it } from 'vitest';

import { classifyConnectivityFailure } from './authConnectivity';

describe('classifyConnectivityFailure', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  it('detects server unreachable network errors', () => {
    expect(classifyConnectivityFailure(new TypeError('Failed to fetch'))).toBe('server-unreachable');
  });

  it('detects server errors from HTTP status', () => {
    expect(classifyConnectivityFailure({ status: 503 })).toBe('server-error');
  });

  it('returns null for auth failures', () => {
    expect(classifyConnectivityFailure({ status: 401 })).toBeNull();
  });
});
