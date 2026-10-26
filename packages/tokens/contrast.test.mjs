import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { contrastRatioHex, pickChipForegroundHex } from './contrast-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const colorJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens/color.json'), 'utf8'));

const MIN_TEXT_RATIO = 4.5;
const MIN_UI_RATIO = 3;

const CHIP_FG_LIGHT = '#0f172a';
const CHIP_FG_DARK = '#ffffff';

/** @type {[string, string][]} */
const TEXT_PAIRS = [
  ['text', 'bg-raised'],
  ['text', 'bg'],
  ['text', 'bg-overlay'],
  ['text', 'bg-muted'],
  ['text-muted', 'bg-raised'],
  ['text-muted', 'bg'],
  ['text-muted', 'bg-overlay'],
  ['text-subtle', 'bg-raised'],
  ['text-subtle', 'bg'],
  ['accent-text', 'bg-raised'],
  ['accent-text', 'bg'],
  ['accent-text', 'bg-overlay'],
  ['accent-text', 'accent-soft'],
  ['error-text', 'bg'],
  ['error-text', 'bg-raised'],
  ['header-fg', 'header-bg'],
  ['header-muted', 'header-bg'],
  ['header-surface-fg', 'header-surface'],
  ['header-input-fg', 'header-input-bg'],
  ['header-control-fg', 'header-control-bg'],
  ['table-header-fg', 'bg-raised'],
  ['on-accent', 'accent-fill'],
  ['on-danger', 'danger'],
  ['danger', 'danger-soft'],
  ['danger-strong', 'danger-soft'],
  ['ok', 'bg-raised'],
  ['ok-strong', 'bg-raised'],
  ['ok', 'ok-soft'],
  ['progress-label', 'bg-raised'],
  ['progress-label', 'accent-soft'],
  ['pdf-chrome-text', 'pdf-chrome'],
  ['pdf-chrome-text-muted', 'pdf-chrome'],
];

/** @type {[string, string][]} */
const UI_PAIRS = [
  ['header-input-placeholder', 'header-input-bg'],
  ['header-control-active-fg', 'header-control-active-bg'],
  ['accent-contrast', 'accent-fill'],
  ['focus', 'bg-raised'],
  ['focus', 'bg'],
];

/** @type {string[]} */
const LABEL_PRESET_KEYS = [
  'label-default',
  'label-preset-slate',
  'label-preset-blue',
  'label-preset-emerald',
  'label-preset-amber',
  'label-preset-rose',
  'label-preset-violet',
  'label-preset-cyan',
  'label-preset-orange',
];

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

function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function ratioForPair(fg, bg) {
  if (!isHexColor(fg) || !isHexColor(bg)) {
    return null;
  }
  return contrastRatioHex(fg, bg);
}

const failures = [];
const report = [];

for (const theme of ['light', 'dark']) {
  for (const [fgKey, bgKey] of TEXT_PAIRS) {
    const { fg, bg } = pair(theme, fgKey, bgKey);
    const ratio = ratioForPair(fg, bg);
    if (ratio === null) {
      failures.push({
        theme,
        fgKey,
        bgKey,
        fg,
        bg,
        ratio: 0,
        minRequired: MIN_TEXT_RATIO,
        reason: 'non-hex token',
      });
      continue;
    }
    report.push({ theme, fgKey, bgKey, ratio, minRequired: MIN_TEXT_RATIO });
    if (Math.round(ratio * 100) / 100 < MIN_TEXT_RATIO) {
      failures.push({ theme, fgKey, bgKey, fg, bg, ratio, minRequired: MIN_TEXT_RATIO });
    }
  }

  for (const [fgKey, bgKey] of UI_PAIRS) {
    const { fg, bg } = pair(theme, fgKey, bgKey);
    const ratio = ratioForPair(fg, bg);
    if (ratio === null) {
      continue;
    }
    report.push({ theme, fgKey, bgKey, ratio, minRequired: MIN_UI_RATIO });
    if (Math.round(ratio * 100) / 100 < MIN_UI_RATIO) {
      failures.push({ theme, fgKey, bgKey, fg, bg, ratio, minRequired: MIN_UI_RATIO });
    }
  }

  for (const presetKey of LABEL_PRESET_KEYS) {
    const bg = colorJson.color[theme][presetKey].value;
    if (!isHexColor(bg)) {
      continue;
    }
    const fg = pickChipForegroundHex(bg, { light: CHIP_FG_LIGHT, dark: CHIP_FG_DARK });
    const ratio = contrastRatioHex(fg, bg);
    report.push({ theme, fgKey: `chip-on-${presetKey}`, bgKey: presetKey, ratio, minRequired: MIN_TEXT_RATIO });
    if (Math.round(ratio * 100) / 100 < MIN_TEXT_RATIO) {
      failures.push({
        theme,
        fgKey: `chip-on-${presetKey}`,
        bgKey: presetKey,
        fg,
        bg,
        ratio,
        minRequired: MIN_TEXT_RATIO,
      });
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

console.log(`Token contrast OK (${report.length} pairs checked)`);
