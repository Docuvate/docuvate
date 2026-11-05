// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { groupLayoutPanelFields } from './layoutPanelFieldGroups';

const labels: Record<string, string> = {
  'global:sender': 'Absender',
  'global:iban': 'IBAN',
  'global:total': 'Betrag brutto',
};
const labelFor = (key: string) => labels[key] ?? key;

describe('groupLayoutPanelFields', () => {
  const fields = [
    { key: 'global:sender', value: '' },
    { key: 'global:iban', value: 'DE00 0000' },
    { key: 'global:total', value: '   ' },
  ];

  it('puts empty values into the missing group and keeps order', () => {
    const groups = groupLayoutPanelFields(fields, '', labelFor);
    expect(groups.found.map((f) => f.key)).toEqual(['global:iban']);
    expect(groups.missing.map((f) => f.key)).toEqual(['global:sender', 'global:total']);
  });

  it('filters by the visible field name, case-insensitive', () => {
    const groups = groupLayoutPanelFields(fields, 'BETRAG', labelFor);
    expect(groups.found).toEqual([]);
    expect(groups.missing.map((f) => f.key)).toEqual(['global:total']);
  });
});
