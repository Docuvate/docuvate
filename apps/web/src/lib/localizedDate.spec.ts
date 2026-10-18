// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { isoDateToLocalizedDisplay, localizedDisplayToIsoDate } from './localizedDate';

describe('localizedDate', () => {
  it('formats and parses German dates', () => {
    expect(isoDateToLocalizedDisplay('2026-10-08', 'de')).toBe('08.10.2026');
    expect(localizedDisplayToIsoDate('08.10.2026', 'de')).toBe('2026-10-08');
  });

  it('formats and parses English dates', () => {
    expect(isoDateToLocalizedDisplay('2026-10-08', 'en')).toBe('10/08/2026');
    expect(localizedDisplayToIsoDate('10/08/2026', 'en')).toBe('2026-10-08');
  });
});
