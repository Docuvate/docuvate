// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Token governance: palette freeze, scale hygiene, alias integrity, generated output in sync.
 * Run: pnpm --filter @docuvate/tokens test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { colorRoles, loadStaticTokens, readColorJson, STATIC_FILES, tokensDir } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const failures = [];
const fail = (msg) => failures.push(msg);

// 1. Palette freeze — every brand / semantic colour is byte-identical to the frozen palette.
const freeze = JSON.parse(fs.readFileSync(path.join(here, 'governance/color-freeze.json'), 'utf8'));
const colorJson = readColorJson();
for (const theme of ['light', 'dark']) {
  const live = colorJson.color[theme];
  const frozen = freeze[theme];
  for (const [role, value] of Object.entries(frozen)) {
    if (!live[role]) fail(`color.${theme}.${role} was removed (frozen: ${value})`);
    else if (live[role].value !== value) {
      fail(`color.${theme}.${role} changed ${value} -> ${live[role].value} (palette is frozen)`);
    }
  }
  for (const role of Object.keys(live)) {
    if (!(role in frozen))
      fail(`color.${theme}.${role} is new; add it to governance/color-freeze.json deliberately`);
  }
}
if (freeze.light.accent !== '#d9480f') fail('Brand accent must stay #d9480f');

// 2. Light/dark parity.
for (const r of colorRoles(colorJson)) {
  if (r.dark == null) fail(`color role ${r.role} has no dark value`);
}

// 3. Static tokens: aliases resolve (loadStaticTokens throws otherwise), names are kebab-case.
const tokens = loadStaticTokens();
for (const t of tokens) {
  if (!t.path.every((p) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(p)))
    fail(`token ${t.id} is not kebab-case`);
  if (/#[0-9a-f]{3,8}\b/i.test(t.value))
    fail(`token ${t.id} hard-codes a hex colour; colours belong in color.json`);
}

// 4. No duplicate values inside a primitive scale (aliases are the way to share a value).
const SCALES = ['space', 'radius', 'font.size', 'shadow', 'motion.duration', 'z'];
for (const scale of SCALES) {
  const members = tokens.filter((t) => t.id.startsWith(`${scale}.`) && !t.aliasOf);
  const seen = new Map();
  for (const t of members) {
    if (seen.has(t.value))
      fail(`${scale}: ${t.id} duplicates ${seen.get(t.value)} (${t.value}); use an alias`);
    seen.set(t.value, t.id);
  }
}

// 5. Rhythm: spacing ≥ 0.5rem sits on the 4px grid; radii never exceed 12px.
const remPx = (v) =>
  v.endsWith('rem') ? parseFloat(v) * 16 : v.endsWith('px') ? parseFloat(v) : NaN;
for (const t of tokens.filter((x) => x.id.startsWith('space.'))) {
  const px = remPx(t.resolved);
  if (px >= 8 && px % 4 !== 0) fail(`${t.id} = ${t.resolved} is off the 4px grid`);
}
for (const t of tokens.filter((x) => x.id.startsWith('radius.'))) {
  if (remPx(t.resolved) > 12) fail(`${t.id} = ${t.resolved} exceeds the 12px radius cap`);
}
// Density tokens are semantic names for the spacing scale, never new values.
for (const t of tokens.filter((x) => x.id.startsWith('density.'))) {
  if (!t.aliasOf?.startsWith('space.')) fail(`${t.id} must alias a space.* token`);
}
const touch = tokens.find((t) => t.id === 'control.touch-target');
if (!touch || remPx(touch.resolved) < 44) fail('control.touch-target must be >= 44px');

// 6. Every static file is wired into the build.
for (const file of fs.readdirSync(tokensDir)) {
  if (file.endsWith('.json') && file !== 'color.json' && !STATIC_FILES.includes(file)) {
    fail(`tokens/${file} is not listed in STATIC_FILES (lib.mjs)`);
  }
}

// 7. Generated CSS is in sync with sources (catches hand edits of dist/).
const cssPath = path.join(here, 'dist/css/tokens.css');
if (fs.existsSync(cssPath)) {
  const css = fs.readFileSync(cssPath, 'utf8');
  for (const t of tokens) {
    if (!css.includes(`${t.cssVar}: ${t.cssValue};`))
      fail(`dist/css/tokens.css is stale for ${t.cssVar}; run the build`);
  }
} else {
  fail('dist/css/tokens.css missing; run pnpm --filter @docuvate/tokens build');
}

if (failures.length > 0) {
  console.error(`Token governance failed (${String(failures.length)}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`Token governance OK (${String(tokens.length)} static tokens, palette frozen)`);
