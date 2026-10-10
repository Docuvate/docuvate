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

const componentsCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'components.css'),
  'utf8'
);

describe('controlMetrics', () => {
  it('matches components.css custom properties', () => {
    expect(componentsCss).toContain(`--dv-control-height: ${String(CONTROL_HEIGHT_PX)}px`);
    expect(componentsCss).toContain(`--dv-icon-btn-sm: ${String(ICON_BUTTON_SM_PX)}px`);
    expect(componentsCss).toContain(`--dv-icon-btn-md: ${String(ICON_BUTTON_MD_PX)}px`);
  });

  it('documents geometry tolerance for browser checks', () => {
    expect(GEOMETRY_TOLERANCE_PX).toBe(1);
    expect(ICON_GLYPH_PX).toBe(16);
  });
});
