// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { contrastRatio, meetsChipContrast, parseHexColor, rgbToHex } from './chipContrast';
import { chipColorStyle } from './chipColorStyle';
import {
  LABEL_COLOR_PRESET_IDS,
  labelColorPresetHex,
} from './labelColorPresets';

const THEMES = ['light', 'dark'] as const;

function ratioFromStyle(
  style: ReturnType<typeof chipColorStyle>
): number | null {
  if (!style) {
    return null;
  }
  const fg = style['--chip-fg'];
  const bg = style['--chip-bg'];
  if (!fg || !bg) {
    return null;
  }
  const fgRgb = parseHexColor(fg);
  const bgRgb = parseHexColor(bg);
  if (!fgRgb || !bgRgb) {
    return null;
  }
  return contrastRatio(fgRgb, bgRgb);
}

describe('chipColorStyle', () => {
  it('meets WCAG AA contrast for every preset in light and dark themes', () => {
    for (const theme of THEMES) {
      for (const presetId of LABEL_COLOR_PRESET_IDS) {
        const hex = labelColorPresetHex(presetId);
        expect(meetsChipContrast(hex, theme)).toBe(true);
        const style = chipColorStyle(hex, theme);
        const ratio = ratioFromStyle(style);
        expect(ratio).not.toBeNull();
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('returns readable colors for a saturated amber chip', () => {
    const bg = '#f59e0b';
    const style = chipColorStyle(bg, 'light');
    const ratio = ratioFromStyle(style);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('adjusts mid-tone backgrounds when neither foreground reaches 4.5:1', () => {
    const mid = '#c4bcb4';
    const style = chipColorStyle(mid, 'light');
    const adjustedBg = style?.['--chip-bg'];
    expect(adjustedBg).toBeDefined();
    const ratio = ratioFromStyle(style);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    const fg = style?.['--chip-fg'];
    const bgRgb = parseHexColor(adjustedBg ?? '');
    const fgRgb = parseHexColor(fg ?? '');
    if (!bgRgb || !fgRgb) {
      throw new Error('adjusted colors missing');
    }
    expect(rgbToHex(bgRgb)).toBe(adjustedBg?.toLowerCase());
    expect(contrastRatio(fgRgb, bgRgb)).toBeGreaterThanOrEqual(4.5);
  });
});
