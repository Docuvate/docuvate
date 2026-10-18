/**
 * Copy committed brand files from docs/assets/logo into apps/site/public (single source of truth).
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(siteRoot, '../..');
const brandSrc = join(repoRoot, 'docs', 'assets', 'logo');
const publicRoot = join(siteRoot, 'public');
const brandDest = join(publicRoot, 'brand');

mkdirSync(brandDest, { recursive: true });

const copies = [
  ['logo-light.svg', 'logo-light.svg'],
  ['logo-dark.svg', 'logo-dark.svg'],
  ['mark.svg', 'mark.svg'],
  ['social-preview.png', 'social-preview.png'],
  ['logo-1024.png', 'logo-1024.png'],
];

for (const [from, to] of copies) {
  copyFileSync(join(brandSrc, from), join(brandDest, to));
}

copyFileSync(join(brandDest, 'logo-1024.png'), join(publicRoot, 'apple-touch-icon.png'));
copyFileSync(join(brandDest, 'social-preview.png'), join(publicRoot, 'og-image.png'));

const mark = readFileSync(join(brandSrc, 'mark.svg'), 'utf8');
writeFileSync(
  join(publicRoot, 'favicon.svg'),
  mark.replaceAll('currentColor', '#cb3a00')
);
writeFileSync(
  join(publicRoot, 'favicon-dark.svg'),
  mark.replaceAll('currentColor', '#e96f49')
);

console.log('Synced brand assets from docs/assets/logo → public/');
