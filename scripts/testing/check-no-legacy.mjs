#!/usr/bin/env node
/**
 * Fail CI if banned install-compat tokens reappear in source, docs, or OpenAPI.
 * Community export: no references to private export tooling paths.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');

const BANNED = [
  new RegExp('(?<![\\w-])dep' + 'recated(?![\\w-])', 'i'),
  new RegExp('(?<![\\w-])leg' + 'acy(?![\\w-])', 'i'),
  new RegExp('\\bpg-' + 'upgrade\\b', 'i'),
  new RegExp('\\bpg_' + 'upgrade\\b', 'i'),
  new RegExp(['postgres', String.fromCharCode(58), '16'].join(''), 'i'),
];

const ALLOWLIST = [
  /^scripts\/testing\/check-no-legacy\.mjs$/,
  /^scripts\/ci\/agent-vm-docker-setup\.sh$/,
  /^scripts\/ci\/agent-docker-forward\.sh$/,
  /^docs\/local-ci\.md$/,
  /^apps\/site\/scripts\/check-dist-marketing-palette\.mjs$/,
  /^pnpm-lock\.yaml$/,
];

const SCAN_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.sh',
  '.py',
  '.sql',
]);

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.venv',
  '.nx',
  'packages/sdk-flutter/lib/src/generated',
  'packages/sdk-node/src/generated',
]);

function isAllowlisted(relPath) {
  return ALLOWLIST.some((rule) =>
    rule instanceof RegExp ? rule.test(relPath) : relPath === rule
  );
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) {
      walk(abs, out);
      continue;
    }
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    out.push(abs);
  }
  return out;
}

const hits = [];

for (const abs of walk(ROOT)) {
  const rel = relative(ROOT, abs).replaceAll('\\', '/');
  if (isAllowlisted(rel)) continue;
  const text = readFileSync(abs, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const re of BANNED) {
      if (re.test(line)) {
        hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
      }
    }
  }
}

if (hits.length > 0) {
  console.error(`check-no-legacy: ${hits.length} hit(s):`);
  for (const h of hits.slice(0, 50)) {
    console.error(`  ${h}`);
  }
  if (hits.length > 50) {
    console.error(`  … and ${hits.length - 50} more`);
  }
  process.exit(1);
}

console.log('check-no-legacy OK');
