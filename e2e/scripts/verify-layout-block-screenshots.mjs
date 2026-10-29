#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const REQUIRED = [
  'layout-blocks-360-light.png',
  'layout-blocks-390-light.png',
  'layout-blocks-1024-light.png',
  'layout-blocks-1440-light.png',
];

function main() {
  const rootDir = process.env.LAYOUT_BLOCKS_ARTIFACT_DIR;
  if (!rootDir) {
    console.error('LAYOUT_BLOCKS_ARTIFACT_DIR is required');
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
      console.error(`Missing layout-block screenshots: ${missing.join(', ')}`);
    }
    if (empty.length > 0) {
      console.error(`Empty layout-block screenshots: ${empty.join(', ')}`);
    }
    process.exit(1);
  }
  console.log(`Layout-block screenshot verification OK (${String(REQUIRED.length)} PNGs)`);
}

main();
