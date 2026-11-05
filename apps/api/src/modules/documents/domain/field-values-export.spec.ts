// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  escapeCsvCell,
  groupFieldValuesForJson,
  serializeFieldValuesCsv,
  serializeFieldValuesJson,
} from './field-values-export.js';

describe('field-values-export', () => {
  it('escapes CSV cells with quotes and commas', () => {
    expect(escapeCsvCell('plain')).toBe('plain');
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('serializes CSV with header and CRLF', () => {
    const csv = serializeFieldValuesCsv([
      {
        documentId: 'd1',
        title: 'Invoice, ACME',
        filename: 'a.pdf',
        fieldKey: 'global:absender',
        value: 'ACME',
        confidence: 0.9,
      },
    ]);
    expect(csv.startsWith('documentId,title,filename,fieldKey,value,confidence\r\n')).toBe(true);
    expect(csv).toContain('"Invoice, ACME"');
    expect(csv).toContain('0.9');
  });

  it('groups JSON by document', () => {
    const rows = [
      {
        documentId: 'd1',
        title: 'T',
        filename: 'a.pdf',
        fieldKey: 'global:datum',
        value: '2024-01-02',
        confidence: null,
      },
      {
        documentId: 'd1',
        title: 'T',
        filename: 'a.pdf',
        fieldKey: 'global:absender',
        value: 'ACME',
        confidence: 0.5,
      },
    ];
    const grouped = groupFieldValuesForJson(rows);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.documentId).toBe('d1');
    expect(grouped[0]?.fields).toHaveLength(2);
    const json = serializeFieldValuesJson(rows);
    expect(json).toContain('"documentId": "d1"');
    expect(json).toContain('"key": "global:absender"');
  });
});
