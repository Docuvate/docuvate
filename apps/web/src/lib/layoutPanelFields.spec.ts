// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { fieldsForLayoutPanel } from './layoutPanelFields';

const SYNTHETIC_PAPER_TITLE =
  'Synthetic Nine Word Academic Title Case Example Heading';

describe('fieldsForLayoutPanel', () => {
  it('drops heading-like vendor values', () => {
    const fields = [{ key: 'vendor', value: SYNTHETIC_PAPER_TITLE }];
    expect(fieldsForLayoutPanel(fields)).toEqual([]);
  });

  it('keeps plausible vendor rows', () => {
    const fields = [
      { key: 'suggestion:vendor', value: 'Muster Layout GmbH, 10115 Berlin' },
      { key: 'date', value: '01.01.2026' },
    ];
    expect(fieldsForLayoutPanel(fields)).toEqual(fields);
  });

  it('keeps one Absender when vendor and global:vendor both carry the same value', () => {
    const fields = [
      { key: 'vendor', value: 'Demo Absender GmbH', confidence: 0.7, userConfirmed: true },
      {
        key: 'global:vendor',
        value: 'Demo Absender GmbH',
        confidence: 1,
        userConfirmed: true,
      },
      { key: 'amount', value: '12,00', userConfirmed: true },
    ];
    const panel = fieldsForLayoutPanel(fields);
    const vendorRows = panel.filter(
      (row) => row.key === 'vendor' || row.key === 'global:vendor' || row.key === 'absender'
    );
    expect(vendorRows).toHaveLength(1);
    expect(vendorRows[0]?.key).toBe('global:vendor');
    expect(panel.some((row) => row.key === 'amount')).toBe(true);
  });
});
