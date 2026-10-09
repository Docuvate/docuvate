// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { verifyCitedClaims } from './verify-cited-claims.js';
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';

/** Mirrors scripts/seed-cited-chat-bench.mjs after normalizeDocumentText chunking. */
const MIETE_BODY = 'Die Miete ist bis zum 3. Werktag des Monats fällig.';
const KUENDIGUNG_BODY = 'Die Kündigungsfrist beträgt drei Monate zum Quartalsende.';
const RECHNUNG_BODY =
  'Rechnung Nordwind GmbH Gesamtsumme: 1.234,56 EUR IBAN DE89370400440532013000';

function row(
  id: string,
  title: string,
  body: string,
  documentId?: string
): { chunk: CitedChatChunkCandidate } {
  return {
    chunk: {
      chunkId: id,
      documentId: documentId ?? id,
      documentTitle: title,
      body,
      page: 1,
      charStart: 0,
      charEnd: body.length,
      fusionScore: 0.2,
    },
  };
}

describe('cited chat bench fixtures (quote + source mapping)', () => {
  const top = [
    row('rechnung', 'Rechnung Nordwind GmbH', RECHNUNG_BODY),
    row('miete', 'Mietvertrag Wohnung', MIETE_BODY),
    row('kuendigung', 'Arbeitsvertrag', KUENDIGUNG_BODY),
    row('hund', 'Bescheid Hundesteuer', 'Jahresgebühr: 120,00 EUR'),
  ];
  const labelByChunk = new Map([
    ['rechnung', 'S1'],
    ['miete', 'S2'],
    ['kuendigung', 'S3'],
    ['hund', 'S4'],
  ]);

  it('rejects claims without a source label (no unlabeled bind)', () => {
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die Hundesteuer ist bis zum Werktag des Monats fällig.',
          quote: 'Werktag des Monats fällig',
        },
      ],
      top,
      labelByChunk,
    });
    expect(verified).toHaveLength(0);
    expect(rejected[0]?.reason).toBe('unknown_source');
  });

  it('rejects unlabeled claim even when quote is unique in top', () => {
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Nordwind Rechnung Gesamtsumme der Hundesteuer 1.234,56 EUR.',
          quote: 'Gesamtsumme: 1.234,56 EUR',
        },
      ],
      top,
      labelByChunk,
    });
    expect(verified).toHaveLength(0);
    expect(rejected[0]?.reason).toBe('unknown_source');
  });

  it('rejects cross-document rebind when label points at another doc', () => {
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die Miete ist bis zum 3. Werktag fällig.',
          source: 'S1',
          quote: 'bis zum 3. Werktag',
        },
      ],
      top,
      labelByChunk,
    });
    expect(verified).toHaveLength(0);
    expect(rejected[0]?.reason).toBe('quote_in_other_document');
  });

  it('rejects wrong Hundesteuer amount bound to Nordwind invoice quote', () => {
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die Hundesteuer beträgt 1.234,56 EUR.',
          source: 'S4',
          quote: 'Gesamtsumme: 1.234,56 EUR',
        },
      ],
      top,
      labelByChunk,
    });
    expect(verified).toHaveLength(0);
    expect(rejected[0]?.reason).toBe('quote_in_other_document');
  });

  it('rejects non-numeric cross-document quote with labeled source', () => {
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die Hundesteuer ist bis zum 3. Werktag fällig.',
          source: 'S4',
          quote: 'bis zum 3. Werktag',
        },
      ],
      top,
      labelByChunk,
    });
    expect(verified).toHaveLength(0);
    expect(rejected[0]?.reason).toBe('quote_in_other_document');
  });

  it('rebinds to another chunk of the same document when label chunk lacks the quote', () => {
    const docId = 'hund-doc';
    const sameDocTop = [
      row('hund-head', 'Bescheid Hundesteuer', 'Bescheid Hundesteuer Stadt Muster', docId),
      row('hund-body', 'Bescheid Hundesteuer', 'Jahresgebühr: 120,00 EUR', docId),
      row('rechnung', 'Rechnung Nordwind GmbH', RECHNUNG_BODY),
    ];
    const sameDocLabels = new Map([
      ['hund-head', 'S4'],
      ['hund-body', 'S5'],
      ['rechnung', 'S1'],
    ]);
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die Jahresgebühr beträgt 120,00 EUR.',
          source: 'S4',
          quote: 'Jahresgebühr: 120,00 EUR',
        },
      ],
      top: sameDocTop,
      labelByChunk: sameDocLabels,
    });
    expect(rejected).toHaveLength(0);
    expect(verified).toHaveLength(1);
    expect(verified[0].chunkId).toBe('hund-body');
  });

  it('verifies Kündigungsfrist quote with correct source label', () => {
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die Kündigungsfrist beträgt drei Monate zum Quartalsende.',
          source: 'S3',
          quote: 'drei Monate zum Quartalsende',
        },
      ],
      top,
      labelByChunk,
    });
    expect(rejected).toHaveLength(0);
    expect(verified[0]?.chunkId).toBe('kuendigung');
  });

  it('accepts multi-citation claim when each amount has its own quote', () => {
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Gesamtsumme 1.234,56 EUR und Hundesteuer 120,00 EUR.',
          citations: [
            { source: 'S1', quote: 'Gesamtsumme: 1.234,56 EUR' },
            { source: 'S4', quote: 'Jahresgebühr: 120,00 EUR' },
          ],
        },
      ],
      top,
      labelByChunk,
    });
    expect(rejected).toHaveLength(0);
    expect(verified).toHaveLength(2);
    expect(new Set(verified.map((v) => v.chunkId))).toEqual(new Set(['rechnung', 'hund']));
  });

  it('rebinds IBAN quote from retrieval pool when top chunk omits IBAN line', () => {
    const docId = 'rechnung-doc';
    const head =
      'Rechnung Nordwind GmbH Gesamtsumme: 1.234,56 EUR und weitere Vertragsdetails zum Leistungsumfang.';
    const tail = 'IBAN DE89370400440532013000';
    const pool = [
      row('r-head', 'Rechnung Nordwind GmbH', head, docId),
      row('r-iban', 'Rechnung Nordwind GmbH', tail, docId),
    ];
    const top = [pool[0]];
    const labels = new Map([['r-head', 'S1'], ['r-iban', 'S2']]);
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die IBAN des Absenders ist DE89370400440532013000.',
          source: 'S1',
          quote: 'IBAN DE89370400440532013000',
        },
      ],
      top,
      labelByChunk: labels,
      chunkPool: pool,
    });
    expect(rejected).toHaveLength(0);
    expect(verified).toHaveLength(1);
    expect(verified[0].chunkId).toBe('r-iban');
  });

  it('verifies Miete quote on labeled chunk when passage includes title prefix', () => {
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die Miete ist bis zum 3. Werktag fällig.',
          source: 'S2',
          quote: 'bis zum 3. Werktag',
        },
      ],
      top,
      labelByChunk,
    });
    expect(rejected).toHaveLength(0);
    expect(verified[0]?.chunkId).toBe('miete');
  });

  it('accepts IBAN in claim when the IBAN quote is cited', () => {
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die IBAN des Absenders ist DE89370400440532013000.',
          source: 'S1',
          quote: 'IBAN DE89370400440532013000',
        },
      ],
      top,
      labelByChunk,
    });
    expect(rejected).toHaveLength(0);
    expect(verified).toHaveLength(1);
  });
});
