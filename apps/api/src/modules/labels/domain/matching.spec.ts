// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { contentMatchesRule, shouldAutoAssignTag, shouldSuggestTag } from './matching.js';

describe('contentMatchesRule (Regelbasiertes Matching)', () => {
  const text =
    'Rechnung Nr. 2026-001\nKestrel Auto Service\nBetrag: 688,40 EUR\nVersicherung nicht enthalten.';

  it('ignoriert none', () => {
    expect(contentMatchesRule({ algorithm: 'none', pattern: 'Rechnung', content: text })).toBe(
      false
    );
  });

  it('any: trifft bei mindestens einem Schlüsselwort', () => {
    expect(
      contentMatchesRule({
        algorithm: 'any',
        pattern: 'Fahrzeug\nVersicherung',
        content: text,
      })
    ).toBe(true);
    expect(
      contentMatchesRule({
        algorithm: 'any',
        pattern: 'Steuer\nMiete',
        content: text,
      })
    ).toBe(false);
  });

  it('all: alle Zeilen müssen vorkommen', () => {
    expect(
      contentMatchesRule({
        algorithm: 'all',
        pattern: 'Rechnung\nKestrel',
        content: text,
      })
    ).toBe(true);
    expect(
      contentMatchesRule({
        algorithm: 'all',
        pattern: 'Rechnung\nSteuer',
        content: text,
      })
    ).toBe(false);
  });

  it('exact: exakter Text (Groß/Klein egal)', () => {
    expect(
      contentMatchesRule({
        algorithm: 'exact',
        pattern: text.toUpperCase(),
        content: text,
      })
    ).toBe(true);
  });

  it('regex: Muster auf Inhalt', () => {
    expect(
      contentMatchesRule({
        algorithm: 'regex',
        pattern: '688[,.]40',
        content: text,
      })
    ).toBe(true);
    expect(
      contentMatchesRule({
        algorithm: 'regex',
        pattern: '[unclosed',
        content: text,
      })
    ).toBe(false);
  });
});

describe('Zuordnungsstrategie', () => {
  it('auto für all, exact, regex; Vorschlag für any', () => {
    expect(shouldAutoAssignTag('all')).toBe(true);
    expect(shouldAutoAssignTag('exact')).toBe(true);
    expect(shouldAutoAssignTag('regex')).toBe(true);
    expect(shouldAutoAssignTag('any')).toBe(false);
    expect(shouldSuggestTag('any')).toBe(true);
    expect(shouldSuggestTag('regex')).toBe(false);
  });
});
