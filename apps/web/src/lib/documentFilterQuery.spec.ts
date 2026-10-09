// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import type { TagDto } from '@docuvate/contracts';
import {
  parseDocumentFilterQuery,
  resolveDocumentFilterFields,
  serializeDocumentFilterQuery,
} from './documentFilterQuery.js';
import {
  parseFilterTokenValue,
  quoteFilterValueIfNeeded,
  tokenizeDocumentFilterQuery,
} from './documentFilterQueryLanguage.js';

const tags: TagDto[] = [
  { id: 't1', name: 'Vertrag', color: '#333', isInbox: false },
  { id: 't2', name: 'SEPA Lastschriftmandat', color: '#333', isInbox: false },
  { id: 't3', name: 'Müller "Sonder"', color: '#333', isInbox: false },
  { id: 't4', name: 'Typ:A', color: '#333', isInbox: false },
];

describe('tokenizeDocumentFilterQuery', () => {
  it('keeps quoted label values with spaces in one token', () => {
    expect(tokenizeDocumentFilterQuery('label:"SEPA Lastschriftmandat"')).toEqual([
      'label:"SEPA Lastschriftmandat"',
    ]);
  });

  it('tokenizes multiple labels and free text', () => {
    expect(
      tokenizeDocumentFilterQuery('vertrag label:"SEPA Lastschriftmandat" label:Rechnung')
    ).toEqual(['vertrag', 'label:"SEPA Lastschriftmandat"', 'label:Rechnung']);
  });
});

describe('parseFilterTokenValue', () => {
  it('unescapes quotes inside quoted values', () => {
    expect(parseFilterTokenValue('"Müller \\"Sonder\\""')).toBe('Müller "Sonder"');
  });
});

describe('serialize and parse roundtrip', () => {
  it('roundtrips labels with spaces without free-text residue', () => {
    const serialized = serializeDocumentFilterQuery({ tagIds: ['t2'] }, '', tags);
    expect(serialized).toBe('label:"SEPA Lastschriftmandat"');

    const parsed = resolveDocumentFilterFields(parseDocumentFilterQuery(serialized), tags);
    expect(parsed.fields.tagIds).toEqual(['t2']);
    expect(parsed.fields.q).toBeUndefined();
    expect(parsed.issues).toHaveLength(0);
  });

  it('adds and removes multiple labels cleanly', () => {
    let filters = { tagIds: ['t1'] as string[] | undefined };
    let text = serializeDocumentFilterQuery(filters, 'rechnung', tags);
    expect(text).toBe('label:Vertrag rechnung');

    filters = { tagIds: ['t1', 't2'] };
    text = serializeDocumentFilterQuery(filters, 'rechnung', tags);
    expect(text).toBe('label:Vertrag label:"SEPA Lastschriftmandat" rechnung');

    filters = { tagIds: ['t1'] };
    text = serializeDocumentFilterQuery(filters, 'rechnung', tags);
    const parsed = resolveDocumentFilterFields(parseDocumentFilterQuery(text), tags);
    expect(parsed.fields.tagIds).toEqual(['t1']);
    expect(parsed.fields.q).toBe('rechnung');
  });

  it('handles umlauts, embedded quotes, and colons in label names', () => {
    for (const id of ['t3', 't4'] as const) {
      const serialized = serializeDocumentFilterQuery({ tagIds: [id] }, '', tags);
      const parsed = resolveDocumentFilterFields(parseDocumentFilterQuery(serialized), tags);
      expect(parsed.fields.tagIds).toEqual([id]);
      expect(parsed.issues).toHaveLength(0);
    }
  });

  it('quotes free-text search phrases with spaces', () => {
    const serialized = serializeDocumentFilterQuery({}, 'foo bar', tags);
    expect(serialized).toBe('"foo bar"');
    expect(quoteFilterValueIfNeeded('already"quote')).toBe('"already\\"quote"');
  });
});

describe('label toggle residue regression', () => {
  it('does not leave partial label text in free-text after parse', () => {
    const serialized = serializeDocumentFilterQuery({ tagIds: ['t2'] }, '', tags);
    const active = resolveDocumentFilterFields(parseDocumentFilterQuery(serialized), tags);
    expect(active.fields.q).toBeUndefined();

    const cleared = serializeDocumentFilterQuery({}, '', tags);
    expect(cleared).toBe('');
    const idle = resolveDocumentFilterFields(parseDocumentFilterQuery(cleared), tags);
    expect(idle.fields.q).toBeUndefined();
  });
});
