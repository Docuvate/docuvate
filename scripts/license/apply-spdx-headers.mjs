#!/usr/bin/env node
/**
 * Add SPDX headers to first-party source files (idempotent).
 * Usage: node scripts/license/apply-spdx-headers.mjs [--check]
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  ROOT,
  SCAN_EXTENSIONS,
  SCAN_ROOTS,
  SKIP_DIR_NAMES,
  SKIP_FILE_SUFFIXES,
  headerLines,
} from './spdx-config.mjs';

const checkOnly = process.argv.includes('--check');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) {
      walk(abs, out);
      continue;
    }
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    if (SKIP_FILE_SUFFIXES.some((suffix) => name.endsWith(suffix))) continue;
    out.push(abs);
  }
  return out;
}

function hasSpdx(text) {
  return /SPDX-License-Identifier:/.test(text);
}

function insertHeader(content, relPath) {
  const lines = headerLines(relPath);
  const block = lines.join('\n') + '\n';
  if (hasSpdx(content)) {
    return content;
  }
  if (content.startsWith('#!')) {
    const nl = content.indexOf('\n');
    if (nl === -1) return block + content;
    return content.slice(0, nl + 1) + block + content.slice(nl + 1);
  }
  return block + content;
}

let changed = 0;
let missing = 0;

for (const rootRel of SCAN_ROOTS) {
  const absRoot = join(ROOT, rootRel);
  try {
    statSync(absRoot);
  } catch {
    continue;
  }
  for (const abs of walk(absRoot)) {
    const rel = relative(ROOT, abs).replaceAll('\\', '/');
    const before = readFileSync(abs, 'utf8');
    if (hasSpdx(before)) continue;
    if (checkOnly) {
      missing += 1;
      console.error(`Missing SPDX header: ${rel}`);
      continue;
    }
    const after = insertHeader(before, rel);
    if (after !== before) {
      writeFileSync(abs, after, 'utf8');
      changed += 1;
    }
  }
}

if (checkOnly) {
  if (missing > 0) {
    console.error(`SPDX check failed: ${missing} file(s) without header.`);
    process.exit(1);
  }
  console.log('SPDX headers OK.');
} else {
  console.log(`SPDX headers applied or already present. Updated ${changed} file(s).`);
}
