#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const REQUIRED = [
  'field-regions-long-labels-360-light.png',
  'field-regions-long-labels-390-light.png',
  'field-regions-long-labels-1024-light.png',
  'field-regions-long-labels-1440-light.png',
  'field-regions-long-labels-1920-light.png',
  'field-regions-bottom-sheet-360-light.png',
  'field-regions-bottom-sheet-390-light.png',
  'field-regions-before-rectangle.png',
  'field-regions-after-rectangle.png',
  'field-regions-source-chip-seite-1.png',
];

function main() {
  const rootDir = process.env.FIELD_REGIONS_ARTIFACT_DIR;
  if (!rootDir) {
    console.error('FIELD_REGIONS_ARTIFACT_DIR is required');
    process.exit(1);
  }
  const missing = [];
  const empty = [];
  for (const name of REQUIRED) {
    const full = path.join(rootDir, name);
    if (!fs.existsSync(full)) {
      missing.push(name);
      continue;
    }
    if (fs.statSync(full).size < 1024) {
      empty.push(name);
    }
  }
  if (missing.length > 0 || empty.length > 0) {
    if (missing.length > 0) {
      console.error(`Missing field-region screenshots: ${missing.join(', ')}`);
    }
    if (empty.length > 0) {
      console.error(`Empty field-region screenshots: ${empty.join(', ')}`);
    }
    process.exit(1);
  }
  console.log(`Field-region screenshot verification OK (${String(REQUIRED.length)} PNGs)`);
}

main();
