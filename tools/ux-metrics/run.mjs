#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../..');
const tsxBin = path.join(repoRoot, 'node_modules/.bin/tsx');
const cli = path.join(__dirname, 'src/cli.ts');

const result = spawnSync(tsxBin, [cli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: repoRoot,
  env: process.env,
});

process.exit(result.status ?? 1);
