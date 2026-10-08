#!/usr/bin/env node
/**
 * Fail publish staging if built output leaks dev paths or SSR error stacks.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const staging = process.argv[2] ?? process.env.STAGING_DIR;
if (!staging) {
  console.error('Usage: check-pages-staging.mjs <staging-dir>');
  process.exit(1);
}

const pathLeaks = [
  { re: /file:\/\/\/workspace\//i, label: 'file:///workspace/ dev path' },
  { re: /file:\/\/\/?workspace\//i, label: 'file:// workspace path' },
  { re: /\/workspace\/apps\//, label: '/workspace/apps/ monorepo path' },
  { re: /\/workspace\/node_modules\//, label: '/workspace/node_modules/ path' },
];

const stackLeaks = [
  { re: /\n\s+at\s+\w+/m, label: 'stack trace (at …)' },
  { re: /at Object\./, label: 'at Object.' },
];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p, acc);
    } else if (/\.(html|js|css|json|txt|md)$/i.test(name)) {
      acc.push(p);
    }
  }
  return acc;
}

if (statSync(join(staging, 'client'), { throwIfNoEntry: false })) {
  console.error('Staging must not contain a client/ directory (duplicate Vite output).');
  process.exit(1);
}

const hits = [];
for (const file of walk(staging)) {
  const text = readFileSync(file, 'utf8');
  for (const { re, label } of pathLeaks) {
    if (re.test(text)) {
      hits.push(`${file}: ${label}`);
    }
  }
  if (file.endsWith('.html')) {
    for (const { re, label } of stackLeaks) {
      if (re.test(text)) {
        hits.push(`${file}: ${label}`);
      }
    }
  }
}

if (hits.length) {
  console.error('Pages staging check failed:\n' + hits.slice(0, 40).join('\n'));
  if (hits.length > 40) {
    console.error(`… and ${hits.length - 40} more`);
  }
  process.exit(1);
}

console.log('Pages staging check OK (no file://, /workspace/, or stack traces).');
