import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const gen = join(siteRoot, 'scripts', 'compare', 'gen.py');

const result = spawnSync('python3', [gen], { cwd: siteRoot, encoding: 'utf8' });
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

console.log('Compare data materialized.');
