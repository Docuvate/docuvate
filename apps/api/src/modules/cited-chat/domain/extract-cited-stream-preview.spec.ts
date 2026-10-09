// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import {
  extractReadableCitedAnswerPreview,
  looksLikeCitedAnswerJson,
} from './extract-cited-stream-preview.js';

describe('extractReadableCitedAnswerPreview', () => {
  it('returns empty for incomplete first claim', () => {
    expect(extractReadableCitedAnswerPreview('{"claims":[{"text":"Hal')).toBe('');
  });

  it('extracts one completed claim from partial stream', () => {
    const partial =
      '{"claims":[{"text":"Gesamtsumme: 1.234,56 EUR","source":"S1","quote":"Gesamtsumme';
    expect(extractReadableCitedAnswerPreview(partial)).toBe('Gesamtsumme: 1.234,56 EUR');
  });

  it('extracts multiple completed claims across chunks', () => {
    const chunks = [
      '{"claims":[{"text":"Miete fällig',
      '{"claims":[{"text":"Miete fällig am 3.","source":"S1","quote":"Miete"},{"text":"Zusatz","source":"S2","quote":"Zus"}',
      '{"claims":[{"text":"Miete fällig am 3.","source":"S1","quote":"Miete"},{"text":"Zusatzinfo","source":"S2","quote":"Zusatz"}]}',
    ];
    let preview = '';
    for (const chunk of chunks) {
      preview = extractReadableCitedAnswerPreview(chunk);
    }
    expect(preview).toBe('Miete fällig am 3. Zusatzinfo');
  });

  it('handles umlauts and escaped quotes', () => {
    const raw =
      '{"claims":[{"text":"Größe der Hundesteuer: 120 EUR","source":"S1","quote":"Hundesteuer"}]}';
    expect(extractReadableCitedAnswerPreview(raw)).toBe('Größe der Hundesteuer: 120 EUR');
  });

  it('detects raw json in content', () => {
    expect(looksLikeCitedAnswerJson('{"claims":[]}')).toBe(true);
    expect(looksLikeCitedAnswerJson('Antwort [1]')).toBe(false);
  });
});
