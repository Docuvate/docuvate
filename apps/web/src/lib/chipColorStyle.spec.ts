import { describe, expect, it } from 'vitest';

import { chipColorStyle } from './chipColorStyle';

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const fg = parseHex(fgHex);
  const bg = parseHex(bgHex);
  const l1 = relativeLuminance(fg.r, fg.g, fg.b);
  const l2 = relativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('chipColorStyle', () => {
  it('picks black or white foreground for better contrast on arbitrary label colors', () => {
    const samples = ['#7c3aed', '#f59e0b', '#10b981', '#ffffff', '#0f172a', '#f43f5e', '#06b6d4'];
    for (const bg of samples) {
      const style = chipColorStyle(bg);
      expect(style).toBeDefined();
      const fg = style?.['--chip-fg'];
      expect(fg === '#ffffff' || fg === '#0f172a').toBe(true);
      const ratio = contrastRatio(fg ?? '#000000', bg);
      const alt = fg === '#ffffff' ? '#0f172a' : '#ffffff';
      const altRatio = contrastRatio(alt, bg);
      expect(ratio).toBeGreaterThanOrEqual(altRatio);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});
