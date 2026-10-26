// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocuvateTheme } from '@docuvate/tokens';

import { themePalette } from './themePalette';

export const CHIP_FG_LIGHT = '#0f172a';
export const CHIP_FG_DARK = '#ffffff';

const MIN_CONTRAST = 4.5;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseHexColor(input: string): Rgb | null {
  const trimmed = input.trim();
  const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  if (hex.length === 3) {
    const r = Number.parseInt(hex[0] + hex[0], 16);
    const g = Number.parseInt(hex[1] + hex[1], 16);
    const b = Number.parseInt(hex[2] + hex[2], 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  if (hex.length === 6) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  return null;
}

export function rgbToHex(rgb: Rgb): string {
  const part = (c: number) => c.toString(16).padStart(2, '0');
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(fg: Rgb, bg: Rgb): number {
  const l1 = relativeLuminance(fg.r, fg.g, fg.b);
  const l2 = relativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function mixRgb(a: Rgb, b: Rgb, amountTowardB: number): Rgb {
  const t = Math.min(1, Math.max(0, amountTowardB));
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function foregroundCandidates(theme: DocuvateTheme): Rgb[] {
  const palette = themePalette(theme);
  const fromTokens = [palette.colorText, palette.colorTextMuted, CHIP_FG_LIGHT, CHIP_FG_DARK]
    .map((hex) => parseHexColor(hex))
    .filter((rgb): rgb is Rgb => rgb != null);
  const unique: Rgb[] = [];
  for (const rgb of fromTokens) {
    const key = rgbToHex(rgb);
    if (!unique.some((item) => rgbToHex(item) === key)) {
      unique.push(rgb);
    }
  }
  if (unique.length === 0) {
    const white = parseHexColor(CHIP_FG_DARK);
    const black = parseHexColor(CHIP_FG_LIGHT);
    if (white) unique.push(white);
    if (black) unique.push(black);
  }
  return unique;
}

function pickForeground(bg: Rgb, theme: DocuvateTheme): Rgb {
  const candidates = foregroundCandidates(theme);
  let best = candidates[0];
  let bestRatio = 0;
  for (const fg of foregroundCandidates(theme)) {
    const ratio = contrastRatio(fg, bg);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = fg;
    }
  }
  return best;
}

function ensureContrast(baseBg: Rgb, theme: DocuvateTheme): { bg: Rgb; fg: Rgb } {
  const bg = baseBg;
  const fg = pickForeground(bg, theme);
  if (contrastRatio(fg, bg) >= MIN_CONTRAST) {
    return { bg, fg };
  }
  const towardLight = parseHexColor(CHIP_FG_DARK) ?? { r: 255, g: 255, b: 255 };
  const towardDark = parseHexColor(CHIP_FG_LIGHT) ?? { r: 15, g: 23, b: 42 };
  for (let step = 0.04; step <= 1; step += 0.04) {
    const lightBg = mixRgb(bg, towardLight, step);
    const lightFg = pickForeground(lightBg, theme);
    if (contrastRatio(lightFg, lightBg) >= MIN_CONTRAST) {
      return { bg: lightBg, fg: lightFg };
    }
    const darkBg = mixRgb(bg, towardDark, step);
    const darkFg = pickForeground(darkBg, theme);
    if (contrastRatio(darkFg, darkBg) >= MIN_CONTRAST) {
      return { bg: darkBg, fg: darkFg };
    }
  }
  const fallbackBg = theme === 'dark' ? towardDark : towardLight;
  const fallbackFg = pickForeground(fallbackBg, theme);
  return { bg: fallbackBg, fg: fallbackFg };
}

export function resolveChipColors(
  color: string,
  theme: DocuvateTheme
): { background: string; foreground: string } | undefined {
  const base = parseHexColor(color);
  if (!base) {
    return undefined;
  }
  const resolved = ensureContrast(base, theme);
  return {
    background: rgbToHex(resolved.bg),
    foreground: rgbToHex(resolved.fg),
  };
}

export function meetsChipContrast(
  color: string,
  theme: DocuvateTheme,
  minRatio = MIN_CONTRAST
): boolean {
  const resolved = resolveChipColors(color, theme);
  if (!resolved) {
    return false;
  }
  const bg = parseHexColor(resolved.background);
  const fg = parseHexColor(resolved.foreground);
  if (!bg || !fg) {
    return false;
  }
  return contrastRatio(fg, bg) >= minRatio;
}
