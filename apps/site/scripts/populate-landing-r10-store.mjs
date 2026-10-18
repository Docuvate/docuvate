import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(siteRoot, 'qa-screenshots');
const storeDir = process.env.LANDING_R10_STORE ?? '/cursor/stores/self/landing-r10';
const captureSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
const files = ['docs-api-de-1440-light.png', 'docs-api-de-1440-dark.png'];

mkdirSync(storeDir, { recursive: true });
for (const f of files) {
  const p = join(srcDir, f);
  if (!statSync(p, { throwIfNoEntry: false })) throw new Error(`Missing ${f}`);
  copyFileSync(p, join(storeDir, f));
}
writeFileSync(join(storeDir, 'capture-sha.txt'), `${captureSha}\n`);
writeFileSync(
  join(storeDir, 'index.md'),
  `# Landing R10\n\nGit \`${captureSha}\` — API docs page light/dark.\n`
);
console.log('R10 store @', captureSha);
