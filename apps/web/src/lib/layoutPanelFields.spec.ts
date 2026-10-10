// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { fieldsForLayoutPanel } from './layoutPanelFields';

describe('fieldsForLayoutPanel', () => {
  it('removes vendor/absender when value is the born-digital banner line', () => {
    const fields = [
      {
        key: 'vendor',
        value:
          'Synthetic layout regression document with enough words to classify as born digital.',
      },
      { key: 'datum', value: '01.01.2026' },
    ];
    expect(fieldsForLayoutPanel(fields)).toEqual([{ key: 'datum', value: '01.01.2026' }]);
  });

  it('keeps short vendor values', () => {
    const fields = [{ key: 'vendor', value: 'Acme GmbH' }];
    expect(fieldsForLayoutPanel(fields)).toEqual(fields);
  });

  it('drops banner line even when keyed as Absender', () => {
    const fields = [
      {
        key: 'Absender',
        value:
          'Synthetic layout regression document with enough words to classify as born digital.',
      },
    ];
    expect(fieldsForLayoutPanel(fields)).toEqual([]);
  });
});
