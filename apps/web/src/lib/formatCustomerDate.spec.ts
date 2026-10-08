import { describe, expect, it } from 'vitest';
import { formatCustomerDate } from './formatCustomerDate';

describe('formatCustomerDate', () => {
  it('formats ISO dates for the given locale', () => {
    const formatted = formatCustomerDate('2026-03-15T10:00:00.000Z', 'de-DE');
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/15/);
  });
});
