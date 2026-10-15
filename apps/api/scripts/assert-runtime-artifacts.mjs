#!/usr/bin/env node
/** Fail when Nest build did not copy runtime JSON artifacts into dist (API container layout). */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'dist/modules/documents/domain/artifacts/value-types-field-confidence.v1.json',
];

let failed = false;
for (const rel of required) {
  const path = join(apiRoot, rel);
  if (!existsSync(path)) {
    console.error(`missing API runtime artifact after build: ${rel}`);
    failed = true;
  }
}
if (failed) {
  process.exit(1);
}
