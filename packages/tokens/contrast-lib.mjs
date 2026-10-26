/**
 * WCAG relative luminance and contrast helpers (shared by token tests and consumers).
 */

/** @param {string} hex */
export function parseHex(hex) {
  const h = hex.trim().replace('#', '');
  if (h.length !== 6) {
    throw new Error(`Unsupported hex for contrast: ${hex}`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** @param {{ r: number; g: number; b: number }} rgb */
export function relativeLuminance(rgb) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

/** @param {string} fgHex @param {string} bgHex */
export function contrastRatioHex(fgHex, bgHex) {
  const l1 = relativeLuminance(parseHex(fgHex));
  const l2 = relativeLuminance(parseHex(bgHex));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Pick black or white foreground for a hex background (better WCAG contrast).
 * @param {string} bgHex
 * @param {{ light: string; dark: string }} options
 */
export function pickChipForegroundHex(bgHex, options) {
  const whiteRatio = contrastRatioHex(options.dark, bgHex);
  const blackRatio = contrastRatioHex(options.light, bgHex);
  return whiteRatio > blackRatio ? options.dark : options.light;
}
