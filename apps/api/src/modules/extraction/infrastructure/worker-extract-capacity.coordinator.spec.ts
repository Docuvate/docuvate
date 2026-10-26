// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { parseWorkerRetryAfterSeconds } from './worker-extract-capacity.coordinator.js';

describe('parseWorkerRetryAfterSeconds', () => {
  it('defaults when header is missing', () => {
    expect(parseWorkerRetryAfterSeconds(null)).toBe(5);
  });

  it('parses integer seconds', () => {
    expect(parseWorkerRetryAfterSeconds('12')).toBe(12);
  });
});
