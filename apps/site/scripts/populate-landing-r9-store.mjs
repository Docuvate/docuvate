/**
 * R9 go-live legal palette QA store at current HEAD.
 */
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(siteRoot, 'qa-screenshots');
const storeDir = process.env.LANDING_R9_STORE ?? '/cursor/stores/self/landing-r9';
const captureSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

mkdirSync(storeDir, { recursive: true });

const files = [
  'impressum-de-1440-light.png',
  'impressum-de-1440-dark.png',
  'datenschutz-de-1440-light.png',
  'legal-en-1440-dark.png',
  'landing-de-1440-light-part1.png',
];

for (const f of files) {
  const p = join(srcDir, f);
  if (!statSync(p, { throwIfNoEntry: false })) {
    throw new Error(`Missing capture: ${f}`);
  }
  copyFileSync(p, join(storeDir, f));
}

writeFileSync(join(storeDir, 'capture-sha.txt'), `${captureSha}\n`);

const indexLines = [
  '# Landing R9 artifact store',
  '',
  `Captured from git \`${captureSha}\`.`,
  '',
  '| File | Size (bytes) |',
  '|------|-------------:|',
];

for (const name of files) {
  const st = statSync(join(storeDir, name));
  indexLines.push(`| ${name} | ${st.size} |`);
}

writeFileSync(join(storeDir, 'index.md'), `${indexLines.join('\n')}\n`);
console.log('R9 store @', captureSha);
