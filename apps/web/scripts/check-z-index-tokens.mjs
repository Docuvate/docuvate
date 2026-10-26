#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(webRoot, 'src');
const tokensPath = path.join(srcRoot, 'styles/tokens.css');

const ALLOWED_Z_INDEX =
  /z-index:\s*(?:var\(--dv-z-[a-z-]+\)|calc\(var\(--dv-z-(?:base|[a-z-]+)\)\s*[+-]\s*\d+\)|auto)\s*;/;

function walkCssFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkCssFiles(full, files);
    } else if (entry.name.endsWith('.css')) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];

for (const file of walkCssFiles(srcRoot)) {
  if (path.resolve(file) === path.resolve(tokensPath)) {
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!/z-index:/.test(line)) {
      continue;
    }
    if (ALLOWED_Z_INDEX.test(line.trim())) {
      continue;
    }
    violations.push(`${path.relative(webRoot, file)}:${String(i + 1)}: ${line.trim()}`);
  }
}

if (violations.length > 0) {
  console.error(
    'Use z-index tokens from styles/tokens.css (var(--dv-z-*) or calc(var(--dv-z-base) + N)):\n'
  );
  for (const line of violations) {
    console.error(`  ${line}`);
  }
  process.exit(1);
}

console.log('check-z-index-tokens OK');
