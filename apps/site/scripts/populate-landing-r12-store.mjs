import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(siteRoot, 'qa-screenshots');
const storeDir = process.env.LANDING_R12_STORE ?? '/cursor/stores/self/landing-r12';
const captureSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
const files = [
  'landing-de-1440-light.png',
  'landing-de-1440-dark.png',
  'landing-de-390-light.png',
  'landing-de-390-dark.png',
  'landing-de-390-light-mobile-menu.png',
  'landing-de-390-light-mobile-menu-closed.png',
  'landing-de-integrations-1440-light.png',
  'landing-de-integrations-1440-dark.png',
  'landing-de-anchor-feature-chat-1440-light.png',
  'docs-de-1440-light-toc.png',
  'docs-sdks-de-1440-light.png',
  'docs-api-de-1440-light.png',
  'docs-api-de-1440-dark.png',
  'docs-api-de-390-light.png',
  'docs-api-de-390-light-mobile-menu.png',
  'site-header-de-1440-light.png',
  'site-header-de-1440-dark.png',
  'site-header-de-390-light.png',
  'site-header-de-390-dark.png',
];

mkdirSync(storeDir, { recursive: true });
for (const f of files) {
  const p = join(srcDir, f);
  if (!statSync(p, { throwIfNoEntry: false })) throw new Error(`Missing ${f}`);
  copyFileSync(p, join(storeDir, f));
}
writeFileSync(join(storeDir, 'capture-sha.txt'), `${captureSha}\n`);
writeFileSync(
  join(storeDir, 'index.md'),
  `# Landing R12\n\nMarketing site captures (DE) @ \`${captureSha}\`.\n`
);
console.log('R12 store @', captureSha);
