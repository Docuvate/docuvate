// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  acceptSuggestedField,
  blocksContainingValue,
  confirmFieldKeys,
  nextReviewDocumentId,
  openWorkbenchRowCount,
  reassignFieldValue,
  safeConfirmKeys,
  workbenchRows,
} from './reviewWorkbench';

const fields = [
  { key: 'invoice_number', value: '2026-0042', confidence: 0.97 },
  { key: 'total_amount', value: '84,20 EUR', confidence: 0.64 },
  { key: 'date', value: '01.10.2026', confidence: 0.91, userConfirmed: true },
];

describe('workbenchRows', () => {
  it('orders open values by confidence, then suggestions, then confirmed', () => {
    const rows = workbenchRows(fields, [{ key: 'iban', value: 'DE00', confidence: 0.5 }]);
    expect(rows.map((row) => [row.key, row.state])).toEqual([
      ['total_amount', 'review'],
      ['invoice_number', 'review'],
      ['iban', 'suggested'],
      ['date', 'confirmed'],
    ]);
    expect(openWorkbenchRowCount(rows)).toBe(3);
  });

  it('skips empty values and suggestions that already are fields', () => {
    const rows = workbenchRows(
      [
        { key: 'a', value: ' ' },
        { key: 'b', value: 'x' },
      ],
      [{ key: 'b', value: 'y' }]
    );
    expect(rows.map((row) => row.key)).toEqual(['b']);
  });
});

describe('field mutations', () => {
  it('confirms only safe extracted values', () => {
    const keys = safeConfirmKeys(workbenchRows(fields, []));
    expect(keys).toEqual(['invoice_number']);
    const next = confirmFieldKeys(fields, new Set(keys));
    expect(next[0]).toMatchObject({ confidence: 1, userConfirmed: true });
    expect(next[1]).toMatchObject({ confidence: 0.64 });
  });

  it('moves a value to another field', () => {
    const next = reassignFieldValue(fields, 'total_amount', 'net_amount');
    expect(next.some((field) => field.key === 'total_amount')).toBe(false);
    expect(next.find((field) => field.key === 'net_amount')).toMatchObject({
      value: '84,20 EUR',
      userConfirmed: true,
    });
    expect(reassignFieldValue(fields, 'missing', 'x')).toEqual(fields);
  });

  it('accepts a suggestion and drops its storage row', () => {
    const next = acceptSuggestedField(
      [{ key: 'suggestion:iban', value: 'DE00' }, ...fields],
      'iban',
      'DE00'
    );
    expect(next.some((field) => field.key === 'suggestion:iban')).toBe(false);
    expect(next.at(-1)).toMatchObject({ key: 'iban', userConfirmed: true });
  });
});

describe('navigation helpers', () => {
  it('finds source blocks by normalized text', () => {
    const blocks = [
      { page: 1, x: 0, y: 0, width: 1, height: 1, text: 'Betrag:  84,20 EUR' },
      { page: 1, x: 0, y: 0, width: 1, height: 1, text: 'Beispiel GmbH' },
    ];
    expect(blocksContainingValue(blocks, '84,20 eur')).toHaveLength(1);
    expect(blocksContainingValue(blocks, 'x')).toHaveLength(0);
  });

  it('picks the next queued document after the current one', () => {
    const items = [{ documentId: 'a' }, { documentId: 'b' }, { documentId: 'c' }];
    expect(nextReviewDocumentId(items, 'b')).toBe('c');
    expect(nextReviewDocumentId(items, 'c')).toBe('a');
    expect(nextReviewDocumentId(items, 'z')).toBe('a');
    expect(nextReviewDocumentId([{ documentId: 'a' }], 'a')).toBeNull();
  });
});

describe('suggestion reject filtering', () => {
  it('excludes rejected suggested and unconfirmed review rows from open work', () => {
    const rejects = [
      {
        fieldKey: 'global:sender',
        valueNormalized: 'bdew-strompreisanalyse',
      },
    ];
    const rows = workbenchRows(
      [
        {
          key: 'global:sender',
          value: 'BDEW-Strompreisanalyse',
          confidence: 0.97,
          userConfirmed: false,
        },
        { key: 'global:date', value: '12.12.2023', confidence: 0.5, userConfirmed: false },
      ],
      [{ key: 'global:amount', value: '83.99', confidence: 0.8 }],
      rejects
    );
    expect(rows.map((r) => r.key)).toEqual(['global:date', 'global:amount']);
    expect(openWorkbenchRowCount(rows)).toBe(2);
  });

  it('keeps confirmed rows even when the same value was previously rejected', () => {
    const rejects = [
      { fieldKey: 'global:amount', valueNormalized: '83.99' },
    ];
    const rows = workbenchRows(
      [{ key: 'global:amount', value: '83.99', confidence: 1, userConfirmed: true }],
      [],
      rejects
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.state).toBe('confirmed');
  });
});
