#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cssPath = path.join(repoRoot, 'apps/web/src/styles/app.css');
const css = fs.readFileSync(cssPath, 'utf8');
const blocks = css.match(/\.global-search[^{]*\{[^}]*\}/gs) ?? [];
const forbidden = /#[0-9a-fA-F]{3,8}\b|\brgb[a]?\(|\bhsl[a]?\(/;

for (const block of blocks) {
  if (forbidden.test(block)) {
    console.error('Global search CSS must use --dv-* tokens only (no color literals):\n', block.slice(0, 200));
    process.exit(1);
  }
}

console.log('check-global-search-css-tokens OK');
