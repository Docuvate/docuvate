import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const colorJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens/color.json'), 'utf8'));

const MIN_TEXT_RATIO = 4.5;
const MIN_UI_RATIO = 3;

function parseHex(hex) {
  const h = hex.trim().replace('#', '');
  if (h.length !== 6) {
    throw new Error(`Unsupported color for contrast test: ${hex}`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function relativeLuminance({ r, g, b }) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fgHex, bgHex) {
  const l1 = relativeLuminance(parseHex(fgHex));
  const l2 = relativeLuminance(parseHex(bgHex));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function pair(theme, fgKey, bgKey) {
  const palette = colorJson.color[theme];
  return {
    theme,
    fgKey,
    bgKey,
    fg: palette[fgKey].value,
    bg: palette[bgKey].value,
  };
}

const TEXT_PAIRS = [
  ['text', 'bg-raised'],
  ['text', 'bg'],
  ['accent', 'bg'],
  ['header-fg', 'header-bg'],
  ['header-muted', 'header-bg'],
  ['header-surface-fg', 'header-surface'],
  ['header-input-fg', 'header-input-bg'],
  ['header-control-fg', 'header-control-bg'],
  ['table-header-fg', 'bg-raised'],
];

const UI_PAIRS = [
  ['header-input-placeholder', 'header-input-bg'],
  ['header-control-active-fg', 'header-control-active-bg'],
  ['on-accent', 'accent'],
  ['accent-contrast', 'accent'],
];

const failures = [];

const report = [];

for (const theme of ['light', 'dark']) {
  for (const [fgKey, bgKey] of TEXT_PAIRS) {
    const { fg, bg } = pair(theme, fgKey, bgKey);
    const ratio = contrastRatio(fg, bg);
    report.push({ theme, fgKey, bgKey, ratio, minRequired: MIN_TEXT_RATIO });
    if (Math.round(ratio * 100) / 100 < MIN_TEXT_RATIO) {
      failures.push({ theme, fgKey, bgKey, fg, bg, ratio, minRequired: MIN_TEXT_RATIO });
    }
  }
  for (const [fgKey, bgKey] of UI_PAIRS) {
    const { fg, bg } = pair(theme, fgKey, bgKey);
    const ratio = contrastRatio(fg, bg);
    report.push({ theme, fgKey, bgKey, ratio, minRequired: MIN_UI_RATIO });
    if (Math.round(ratio * 100) / 100 < MIN_UI_RATIO) {
      failures.push({ theme, fgKey, bgKey, fg, bg, ratio, minRequired: MIN_UI_RATIO });
    }
  }
}

if (failures.length > 0) {
  console.error('Token contrast check failed:');
  for (const f of failures) {
    console.error(
      `  ${f.theme} ${f.fgKey} on ${f.bgKey}: ${f.ratio.toFixed(2)} (min ${f.minRequired}:1) (${f.fg} / ${f.bg})`
    );
  }
  process.exit(1);
}

for (const row of report) {
  console.log(
    `contrast ${row.theme} ${row.fgKey}/${row.bgKey}: ${row.ratio.toFixed(2)}:1 (min ${row.minRequired}:1)`
  );
}

console.log(
  `Token contrast OK (${TEXT_PAIRS.length * 2} text pairs >= ${MIN_TEXT_RATIO}:1, ${UI_PAIRS.length * 2} UI pairs >= ${MIN_UI_RATIO}:1)`
);
