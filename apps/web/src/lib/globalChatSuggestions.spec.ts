// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, TagDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { buildGlobalChatSuggestions } from './globalChatSuggestions';

function tag(id: string, name: string): TagDto {
  return { id, name, color: '#64748b', isInbox: false };
}

function doc(
  id: string,
  tag: TagDto,
  fields: { key: string; value: string; confidence: number }[]
): DocumentDto {
  return {
    id,
    filename: `${id}.pdf`,
    title: id,
    mimeType: 'application/pdf',
    status: 'ready',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tags: [tag],
    previewAvailable: false,
    extraction: { fields, blocks: [], text: '' },
  };
}

describe('buildGlobalChatSuggestions', () => {
  it('builds cost chip from top tag and omits sum when fewer than two amount docs', () => {
    const hund = tag('t1', 'Hundesteuer');
    const result = buildGlobalChatSuggestions({
      tags: [hund],
      documents: [doc('d1', hund, [{ key: 'amount', value: '108', confidence: 0.9 }])],
      threads: [],
      locale: 'de-DE',
      now: new Date('2026-10-18T12:00:00Z'),
    });
    expect(result.chips.map((c) => c.text)).toEqual(['Was kostet Hundesteuer?']);
  });

  it('adds sum chip when at least two documents with amounts share the tag', () => {
    const arzt = tag('t1', 'Arztrechnungen');
    const result = buildGlobalChatSuggestions({
      tags: [arzt],
      documents: [
        doc('d1', arzt, [{ key: 'betrag', value: '10', confidence: 0.9 }]),
        doc('d2', arzt, [{ key: 'betrag', value: '20', confidence: 0.9 }]),
      ],
      threads: [],
      locale: 'de-DE',
      now: new Date('2026-10-18T12:00:00Z'),
    });
    expect(result.chips.some((c) => c.text.includes('Summe aller Arztrechnungen 2026'))).toBe(true);
  });
});
