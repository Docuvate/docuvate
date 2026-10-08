#!/usr/bin/env node
/**
 * Fail CI when runtime pins drift from .tool-versions (single source of truth).
 */
import { collectToolVersionErrors } from './validate-tool-versions.mjs';

const errors = collectToolVersionErrors();

if (errors.length) {
  console.error('check-tool-versions: drift detected:\n');
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log('check-tool-versions OK');
