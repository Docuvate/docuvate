// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { ribbonActionClass } from './ribbonAction';

describe('ribbonActionClass', () => {
  it('maps tiers onto one button system and marks menus', () => {
    expect(ribbonActionClass('primary')).toBe(
      'btn btn-sm btn-primary ribbon-action ribbon-action--primary'
    );
    expect(ribbonActionClass('tertiary', { menu: true, className: 'x' })).toBe(
      'btn btn-sm btn-ghost ribbon-action ribbon-action--tertiary ribbon-action--menu x'
    );
  });
});
