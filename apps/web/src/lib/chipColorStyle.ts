// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CSSProperties } from 'react';

type ChipCssVariables = CSSProperties & {
  '--chip-bg': string;
  '--chip-fg': string;
};

const CHIP_FG_ON_LIGHT = '#0f172a';
const CHIP_FG_ON_DARK = '#ffffff';

function parseHexColor(input: string): { r: number; g: number; b: number } | null {
  const trimmed = input.trim();
  const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  return null;
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }): number {
  const l1 = relativeLuminance(fg.r, fg.g, fg.b);
  const l2 = relativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function pickChipForeground(bg: { r: number; g: number; b: number }): string {
  const white = parseHexColor(CHIP_FG_ON_DARK);
  const black = parseHexColor(CHIP_FG_ON_LIGHT);
  if (!white || !black) {
    return CHIP_FG_ON_DARK;
  }
  const whiteRatio = contrastRatio(white, bg);
  const blackRatio = contrastRatio(black, bg);
  return whiteRatio > blackRatio ? CHIP_FG_ON_DARK : CHIP_FG_ON_LIGHT;
}

/** Maps a label hex color to chip CSS variables with readable foreground. */
export function chipColorStyle(color: string | undefined): ChipCssVariables | undefined {
  if (!color) return undefined;
  const rgb = parseHexColor(color);
  if (!rgb) return undefined;
  const fg = pickChipForeground(rgb);
  const style: ChipCssVariables = { '--chip-bg': color, '--chip-fg': fg };
  return style;
}
