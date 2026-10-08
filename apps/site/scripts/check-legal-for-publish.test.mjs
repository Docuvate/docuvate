import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-legal-for-publish.mjs');

const emptyConfig = spawnSync('node', [script], {
  encoding: 'utf8',
  env: { ...process.env, SITE_DIST: '/nonexistent' },
});
assert.equal(emptyConfig.status, 1, 'empty legal.config must fail');
assert.match(emptyConfig.stderr, /imprint fields empty/);

console.log('check-legal-for-publish.test.mjs OK');
