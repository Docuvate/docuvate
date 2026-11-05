#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Design-token guard for apps/web CSS.
 *
 * 1. Every var(--x) without a fallback must resolve to a generated token (@docuvate/tokens),
 *    a property defined in app CSS, or one set at runtime from TSX (style={{ '--x': … }}).
 *    Undefined custom properties silently drop the declaration — this is a hard failure.
 * 2. Ratchet: raw literals (font sizes, radii, shadows, transition timings, rgb()/hsl() colours)
 *    may only go down. Baseline: scripts/design-token-baseline.json.
 *    After removing literals run with --update to lock in the lower count.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(webRoot, '../..');
const srcRoot = path.join(webRoot, 'src');
const baselinePath = path.join(webRoot, 'scripts/design-token-baseline.json');
const generatedCss = path.join(repoRoot, 'packages/tokens/dist/css/tokens.css');
const extraRoots = [path.join(repoRoot, 'packages/ui-catalog/src')];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(css|tsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
}

if (!fs.existsSync(generatedCss)) {
  console.error('check-design-tokens: run `pnpm --filter @docuvate/tokens build` first');
  process.exit(1);
}

const files = [srcRoot, ...extraRoots].flatMap((root) => walk(root));
const defined = new Set();
for (const m of fs.readFileSync(generatedCss, 'utf8').matchAll(/(--[a-zA-Z0-9-]+)\s*:/g))
  defined.add(m[1]);
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1]);
  for (const m of text.matchAll(/['"`](--[a-zA-Z0-9-]+)['"`]\s*[:\],)]/g)) defined.add(m[1]);
}

const undefinedUses = [];
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)\s*(,)?/g)) {
      // Names ending in "-" are template-literal prefixes (var(--dv-type-${role}-size)).
      if (!m[2] && !m[1].endsWith('-') && !defined.has(m[1])) {
        undefinedUses.push(`${path.relative(repoRoot, file)}:${String(i + 1)}: ${m[1]}`);
      }
    }
  });
}

const RULES = {
  'raw-font-size': /font-size:\s*(?![\s])(?!var\(|inherit|initial|unset|100%|1em|0\b)[^;]+;/g,
  'raw-border-radius':
    /border(?:-[a-z]+)*-radius:\s*(?![\s])(?!var\(|0\s*(?:!important)?;|inherit)[^;]+;/g,
  'raw-shadow-color': /box-shadow:[^;]*\brgba?\(/g,
  'raw-transition-timing': /transition:[^;{}]*\b\d*\.?\d+m?s\b[^;{}]*;/g,
  'raw-rgb-hsl': /\b(?:rgba?|hsla?)\(/g,
};

const cssFiles = files.filter((f) => f.endsWith('.css'));
const counts = {};
for (const file of cssFiles) {
  const text = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rel = path.relative(repoRoot, file);
  for (const [rule, re] of Object.entries(RULES)) {
    const n = (text.match(re) ?? []).length;
    if (n > 0) {
      counts[rel] ??= {};
      counts[rel][rule] = n;
    }
  }
}

if (process.argv.includes('--update')) {
  fs.writeFileSync(baselinePath, `${JSON.stringify(counts, null, 2)}\n`);
  console.log(`check-design-tokens: baseline written to ${path.relative(repoRoot, baselinePath)}`);
  process.exit(0);
}

const baseline = fs.existsSync(baselinePath)
  ? JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  : {};
const regressions = [];
for (const [rel, rules] of Object.entries(counts)) {
  for (const [rule, n] of Object.entries(rules)) {
    const allowed = baseline[rel]?.[rule] ?? 0;
    if (n > allowed) regressions.push(`${rel}: ${rule} ${String(n)} > baseline ${String(allowed)}`);
  }
}

if (undefinedUses.length > 0 || regressions.length > 0) {
  if (undefinedUses.length > 0) {
    console.error('Undefined CSS custom properties (add a token or use an existing one):');
    for (const u of undefinedUses) console.error(`  ${u}`);
  }
  if (regressions.length > 0) {
    console.error('New raw style literals — use --dv-* tokens (docs/design-tokens.md):');
    for (const r of regressions) console.error(`  ${r}`);
  }
  process.exit(1);
}
console.log('check-design-tokens OK');
