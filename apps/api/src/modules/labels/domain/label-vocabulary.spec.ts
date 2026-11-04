// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { namesAreNearDuplicate, normalizeLabelKey } from '../../../shared/domain/label-name-similarity.js';
import { isAcceptableLabelCandidate } from './label-candidate-validation.js';

describe('label candidate validation', () => {
  it('normalizes German umlauts via shared helper', () => {
    expect(normalizeLabelKey('Rechnung')).toBe('rechnung');
    expect(normalizeLabelKey('Größe')).toBe('groesse');
  });

  it('detects near duplicate names', () => {
    expect(namesAreNearDuplicate('Rechnung', 'Rechnungen')).toBe(true);
    expect(namesAreNearDuplicate('Haus', 'Photovoltaik')).toBe(false);
    expect(
      namesAreNearDuplicate(
        'Betriebskostenabrechnungsnachzahlungsfestsetzungsbescheid-01-aaaaaaaa',
        'Betriebskostenabrechnungsnachzahlungsfestsetzungsbescheid-02-bbbbbbbb'
      )
    ).toBe(true);
    expect(
      namesAreNearDuplicate(
        `x${'a'.repeat(32)}${'a'.repeat(32)}01`,
        `x${'b'.repeat(32)}${'b'.repeat(32)}02`
      )
    ).toBe(false);
  });

  it('rejects PDF producer metadata as label names', () => {
    expect(isAcceptableLabelCandidate('PDF-XCHANGE PDF-XCHANGE')).toBe(false);
    expect(isAcceptableLabelCandidate('Adobe Acrobat')).toBe(false);
  });
});
