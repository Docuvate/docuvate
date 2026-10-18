#!/usr/bin/env node
/**
 * Report direct runtime dependencies whose SPDX license is GPL or AGPL.
 * CLI tools invoked as separate processes (e.g. poppler-utils) are out of scope.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');
const COPYLEFT = /\b(AGPL|GPL)\b/i;

const roots = [
  join(ROOT, 'node_modules'),
  join(ROOT, 'apps/api/node_modules'),
  join(ROOT, 'apps/web/node_modules'),
  join(ROOT, 'apps/worker/.venv'),
];

function readLicense(pkgDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
    return pkg.license ?? pkg.licenses ?? 'UNKNOWN';
  } catch {
    return null;
  }
}

function scanNodeModules(dir, hits, seen) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name.startsWith('.')) continue;
    const abs = join(dir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (name.startsWith('@')) {
      scanNodeModules(abs, hits, seen);
      continue;
    }
    if (!st.isDirectory()) continue;
    const license = readLicense(abs);
    if (!license) continue;
    const key = `${name}@${license}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const licenseStr = Array.isArray(license)
      ? license.map((l) => l.type).join(', ')
      : String(license);
    if (COPYLEFT.test(licenseStr)) {
      hits.push({ name, license: licenseStr, path: abs });
    }
  }
}

const hits = [];
const seen = new Set();
for (const root of roots) {
  scanNodeModules(root, hits, seen);
}

hits.sort((a, b) => a.name.localeCompare(b.name));

console.log('# Copyleft dependency scan (Node.js package.json licenses)\n');
if (hits.length === 0) {
  console.log('No GPL/AGPL-licensed packages found in scanned node_modules trees.');
} else {
  for (const hit of hits) {
    console.log(`- ${hit.name}: ${hit.license}`);
  }
}

console.log('\n# Python (apps/worker)\n');
console.log(
  'Review apps/worker/pyproject.toml and uv.lock manually; PaddleOCR/PaddlePaddle use Apache-2.0.'
);
console.log('Optional docling/donut extras may pull additional models — verify before production.');
