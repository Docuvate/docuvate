// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  CONTROL_HEIGHT_PX,
  GEOMETRY_TOLERANCE_PX,
  ICON_BUTTON_MD_PX,
  ICON_BUTTON_SM_PX,
  ICON_GLYPH_PX,
} from './controlMetrics';

const tokensCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../../../packages/tokens/dist/css/tokens.css'),
  'utf8'
);

describe('controlMetrics', () => {
  it('exposes control dimensions via design tokens', () => {
    expect(tokensCss).toContain('--dv-control-height: 2.5rem');
    expect(tokensCss).toContain('--dv-control-icon-btn-sm: 1.75rem');
    expect(tokensCss).toContain('--dv-control-icon-btn-md: 2.25rem');
  });

  it('documents geometry tolerance for browser checks', () => {
    expect(GEOMETRY_TOLERANCE_PX).toBe(1);
    expect(CONTROL_HEIGHT_PX).toBe(40);
    expect(ICON_BUTTON_SM_PX).toBe(28);
    expect(ICON_BUTTON_MD_PX).toBe(36);
    expect(ICON_GLYPH_PX).toBe(16);
  });
});
