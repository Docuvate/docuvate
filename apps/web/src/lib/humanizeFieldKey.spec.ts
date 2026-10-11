// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { humanizeFieldKey } from './humanizeFieldKey';

describe('humanizeFieldKey', () => {
  it('uses i18n when defined', () => {
    const t = (key: string, opts?: { defaultValue?: string }) =>
      key === 'documents.fieldKey.datum' ? 'Datum' : (opts?.defaultValue ?? key);
    expect(humanizeFieldKey('datum', t)).toBe('Datum');
  });

  it('title-cases unknown keys', () => {
    const t = (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? '';
    expect(humanizeFieldKey('invoice_total', t)).toBe('Invoice Total');
    expect(humanizeFieldKey('vendorName', t)).toBe('Vendor Name');
  });
});
