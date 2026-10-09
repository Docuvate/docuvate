// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import {
  formatPaperlessCustomFieldValue,
  mapPaperlessCustomFieldType,
  mergePaperlessNotes,
  paperlessCustomFieldStorageKey,
  paperlessDocumentChecksum,
} from './paperless-field-mapping.js';

describe('mapPaperlessCustomFieldType', () => {
  it('maps monetary and documentlink types', () => {
    expect(mapPaperlessCustomFieldType('monetary')).toBe('currency');
    expect(mapPaperlessCustomFieldType('documentlink')).toBe('text');
    expect(mapPaperlessCustomFieldType('date')).toBe('date');
  });
});

describe('formatPaperlessCustomFieldValue', () => {
  it('formats booleans and document links', () => {
    expect(formatPaperlessCustomFieldValue('boolean', true)).toBe('true');
    expect(formatPaperlessCustomFieldValue('documentlink', [12, 34])).toBe('12, 34');
    expect(formatPaperlessCustomFieldValue('monetary', { amount: '9.99' })).toBe('9.99');
  });
});

describe('paperlessCustomFieldStorageKey', () => {
  it('builds stable global keys', () => {
    expect(paperlessCustomFieldStorageKey(7, 'Invoice No')).toBe('global:paperless_7_invoice_no');
  });
});

describe('mergePaperlessNotes', () => {
  it('joins structured notes', () => {
    expect(mergePaperlessNotes([{ note: 'a' }, { note: 'b' }])).toBe('a\nb');
    expect(mergePaperlessNotes('')).toBeNull();
  });
});

describe('paperlessDocumentChecksum', () => {
  it('falls back to modified timestamp', () => {
    expect(paperlessDocumentChecksum({ checksum: null, modified: '2024-01-02T00:00:00Z' })).toBe(
      '2024-01-02T00:00:00Z'
    );
  });
});
