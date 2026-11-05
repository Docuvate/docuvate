// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Shared token helpers for build.mjs and governance tests.
 * Single source of truth: JSON under ./tokens. Everything in dist/ is generated from it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const tokensDir = path.join(here, 'tokens');
export const PREFIX = 'dv';
export const THEME_ATTR = 'data-docuvate-theme';

/** Static (theme-independent) token files, in output order. Colours live only in color.json. */
export const STATIC_FILES = [
  'typography.json',
  'type.json',
  'space.json',
  'radius.json',
  'border.json',
  'shadow.json',
  'motion.json',
  'layer.json',
  'state.json',
];

const ALIAS = /^\{([a-z0-9.-]+)\}$/i;

export function readTokenJson(name) {
  return JSON.parse(fs.readFileSync(path.join(tokensDir, name), 'utf8'));
}

export function readColorJson() {
  return readTokenJson('color.json');
}

function flatten(obj, file, prefixParts = []) {
  const out = [];
  for (const [key, val] of Object.entries(obj)) {
    const parts = [...prefixParts, key];
    if (val && typeof val === 'object' && 'value' in val) {
      out.push({
        path: parts,
        value: String(val.value),
        comment: typeof val.comment === 'string' ? val.comment : '',
        file,
      });
    } else if (val && typeof val === 'object') {
      out.push(...flatten(val, file, parts));
    }
  }
  return out;
}

export function cssVarName(pathParts) {
  return `--${PREFIX}-${pathParts.join('-')}`;
}

export function camelName(pathParts) {
  const flat = pathParts.join('-').split('-').filter(Boolean);
  return flat.map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1))).join('');
}

export function aliasTarget(value) {
  const match = ALIAS.exec(value);
  return match ? match[1] : null;
}

/** Flattened static tokens with alias metadata and fully resolved literal values. */
export function loadStaticTokens() {
  const flat = STATIC_FILES.flatMap((file) => flatten(readTokenJson(file), file));
  const byPath = new Map(flat.map((t) => [t.path.join('.'), t]));
  function resolve(token, seen = new Set()) {
    const target = aliasTarget(token.value);
    if (!target) return token.value;
    if (seen.has(target)) throw new Error(`Circular token alias at ${target}`);
    const next = byPath.get(target);
    if (!next) throw new Error(`Unknown token alias {${target}} in ${token.path.join('.')}`);
    seen.add(target);
    return resolve(next, seen);
  }
  return flat.map((token) => {
    const target = aliasTarget(token.value);
    return {
      ...token,
      id: token.path.join('.'),
      cssVar: cssVarName(token.path),
      camel: camelName(token.path),
      aliasOf: target,
      cssValue: target ? `var(${cssVarName(target.split('.'))})` : token.value,
      resolved: resolve(token),
    };
  });
}

export function colorRoles(colorJson) {
  const light = colorJson.color.light;
  const dark = colorJson.color.dark;
  return Object.keys(light).map((role) => ({
    role,
    cssVar: cssVarName(['color', role]),
    light: light[role].value,
    dark: dark[role]?.value ?? null,
  }));
}
