#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * One-shot, idempotent codemod that maps raw type sizes and transition timings in app CSS onto
 * design tokens. Kept in the repo so the mapping is reviewable and can be re-run on new CSS:
 *
 *   node apps/web/scripts/codemod-design-tokens.mjs [--check]
 *
 * Mapping (rem → token). Values outside the table (≥ 1.1rem display sizes, px) are left alone
 * and tracked by the ratchet in check-design-tokens.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['src/styles/app.css', 'src/components/ui/ds.css', 'src/components/ui/components.css'];

export const FONT_SIZE_MAP = new Map([
  ['0.6875rem', '2xs'],
  ['0.7rem', '2xs'],
  ['0.72rem', '2xs'],
  ['0.75rem', 'xs'],
  ['0.76rem', 'xs'],
  ['0.78rem', 'xs'],
  ['0.8rem', 'compact'],
  ['0.8125rem', 'compact'],
  ['0.82rem', 'compact'],
  ['0.85rem', 'sm'],
  ['0.86rem', 'sm'],
  ['0.875rem', 'sm'],
  ['0.88rem', 'sm'],
  ['0.9rem', 'sm'],
  ['0.92rem', 'sm'],
  ['0.9375rem', 'sm'],
  ['0.95rem', 'sm'],
  ['1rem', 'md'],
  ['1.05rem', 'md'],
  ['1.25rem', 'lg'],
  ['1.35rem', 'title'],
  ['1.5rem', 'title'],
]);

const DURATION_MAP = new Map([
  ['0.1s', 'fast'],
  ['0.12s', 'fast'],
  ['0.15s', 'fast'],
  ['120ms', 'fast'],
  ['150ms', 'fast'],
  ['180ms', 'fast'],
  ['0.2s', 'normal'],
  ['0.22s', 'normal'],
  ['200ms', 'normal'],
  ['0.3s', 'slow'],
  ['0.35s', 'slow'],
  ['0.45s', 'slow'],
]);

function mapFontSizes(css) {
  return css.replace(/font-size:\s*([0-9.]+rem)(\s*!important)?\s*;/g, (match, value, important) => {
    const token = FONT_SIZE_MAP.get(value);
    return token ? `font-size: var(--dv-font-size-${token})${important ?? ''};` : match;
  });
}

/** Only exact equivalents are mapped so radii never visibly change. */
const RADIUS_MAP = new Map([
  ['2px', 'xs'],
  ['0.125rem', 'xs'],
  ['4px', 'sm'],
  ['0.25rem', 'sm'],
  ['8px', 'md'],
  ['0.5rem', 'md'],
  ['12px', 'lg'],
  ['0.75rem', 'lg'],
]);

function mapRadii(css) {
  return css.replace(
    /(border(?:-[a-z]+)*-radius):\s*([0-9.]+(?:px|rem))(\s*!important)?\s*;/g,
    (match, prop, value, important) => {
      const token = RADIUS_MAP.get(value);
      return token ? `${prop}: var(--dv-radius-${token})${important ?? ''};` : match;
    }
  );
}

function mapTransitions(css) {
  return css.replace(/transition:([^;{}]+);/g, (match, body) => {
    if (/var\(--dv-motion/.test(body) && !/\b\d/.test(body.replace(/var\([^)]*\)/g, ''))) return match;
    let next = body.replace(/\b(\d*\.?\d+m?s)\b/g, (d) => {
      const token = DURATION_MAP.get(d);
      return token ? `var(--dv-motion-duration-${token})` : d;
    });
    next = next.replace(/(^|[\s,])ease(?=[\s,]|$)/g, '$1var(--dv-motion-easing-standard)');
    return `transition:${next};`;
  });
}

const check = process.argv.includes('--check');
let changed = 0;
for (const rel of FILES) {
  const file = path.join(webRoot, rel);
  const before = fs.readFileSync(file, 'utf8');
  const after = mapRadii(mapTransitions(mapFontSizes(before)));
  if (after !== before) {
    changed += 1;
    if (!check) fs.writeFileSync(file, after);
    console.log(`${check ? 'would update' : 'updated'} ${rel}`);
  }
}
if (check && changed > 0) process.exit(1);
