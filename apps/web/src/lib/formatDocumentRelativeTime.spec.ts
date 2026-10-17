// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { formatDocumentRelativeTime } from './formatDocumentRelativeTime';

describe('formatDocumentRelativeTime', () => {
  it('formats minutes ago in German', () => {
    const now = Date.parse('2026-10-17T12:00:00.000Z');
    const iso = '2026-10-17T11:55:00.000Z';
    const label = formatDocumentRelativeTime(iso, 'de', now);
    expect(label.length).toBeGreaterThan(0);
  });

  it('returns yesterday label for prior calendar day in German', () => {
    const now = Date.parse('2026-10-17T12:00:00.000Z');
    const iso = '2026-10-16T10:00:00.000Z';
    expect(formatDocumentRelativeTime(iso, 'de', now)).toBe('gestern');
  });
});
