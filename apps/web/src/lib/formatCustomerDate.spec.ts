// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { formatCalendarDate, formatCustomerDate } from './formatCustomerDate';

describe('formatCustomerDate', () => {
  it('formats ISO dates for the given locale', () => {
    const formatted = formatCustomerDate('2026-03-15T10:00:00.000Z', 'de-DE');
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/15/);
  });
});

describe('formatCalendarDate', () => {
  it('formats a calendar date without shifting the day', () => {
    expect(formatCalendarDate('2026-10-22', 'de-DE')).toBe('22. Okt. 2026');
    expect(formatCalendarDate('2026-10-22', 'en-US')).toBe('Oct 22, 2026');
  });

  it('returns values that are not calendar dates unchanged', () => {
    expect(formatCalendarDate('2026-02-30', 'de-DE')).toBe('2026-02-30');
    expect(formatCalendarDate('unknown', 'de-DE')).toBe('unknown');
  });
});
