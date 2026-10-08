/**
 * Sample PNG pixels for old indigo marketing chrome (OKLCH: c≥0.085, h 230–285°).
 * Skips near-neutral pixels. Label embeds can exclude user chip regions.
 */
import { readFileSync } from 'node:fs';
import { converter } from 'culori';
import { PNG } from 'pngjs';

const toOklch = converter('oklch');

function isLegacyIndigoChrome(r, g, b) {
  const a = b / 255;
  const c = toOklch({ mode: 'rgb', r: r / 255, g: g / 255, b: a });
  if (!c || c.l == null || c.c == null) return false;
  if (c.l < 0.06 || c.l > 0.98) return false;
  if (c.c < 0.085) return false;
  const h = c.h ?? 0;
  return h >= 230 && h <= 285;
}

export function sampleBlueTealPixels(pngBuffer, { step = 8, maxHits = 12, skipRectangles = [] } = {}) {
  const png = PNG.sync.read(pngBuffer);
  const hits = [];

  function inSkip(x, y) {
    return skipRectangles.some(
      (rect) => x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h
    );
  }

  for (let y = 0; y < png.height; y += step) {
    for (let x = 0; x < png.width; x += step) {
      if (inSkip(x, y)) continue;
      const i = (png.width * y + x) << 2;
      const r = png.data[i];
      const g = png.data[i + 1];
      const b = png.data[i + 2];
      if (isLegacyIndigoChrome(r, g, b)) {
        const ok = toOklch({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
        hits.push({
          x,
          y,
          hueDeg: Math.round(ok.h ?? 0),
          c: Math.round((ok.c ?? 0) * 1000) / 1000,
        });
        if (hits.length >= maxHits) return hits;
      }
    }
  }
  return hits;
}

/** Lower third of labels captures — user-assigned label chip colours. */
export function labelsEmbedSkipRects(width, height) {
  return [{ x: 0, y: Math.floor(height * 0.42), w: width, h: height - Math.floor(height * 0.42) }];
}

export function auditPngFile(filePath, options = {}) {
  return sampleBlueTealPixels(readFileSync(filePath), options);
}
