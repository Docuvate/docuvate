#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const apply = join(scriptDir, 'apply-spdx-headers.mjs');
const result = spawnSync(process.execPath, [apply, '--check'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
