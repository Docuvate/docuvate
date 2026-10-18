/**
 * Fail if public/screenshots contains PNGs not referenced by the marketing site.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { referencedScreenshotSet } from './referenced-marketing-screenshots.mjs';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(siteRoot, 'public', 'screenshots');
const allowed = referencedScreenshotSet();

if (!statSync(dir, { throwIfNoEntry: false })) {
  console.error('Missing', dir);
  process.exit(1);
}

const extra = readdirSync(dir).filter((f) => f.endsWith('.png') && !allowed.has(f));
const missing = [...allowed].filter((f) => !statSync(join(dir, f), { throwIfNoEntry: false }));

if (extra.length) {
  console.error('Unexpected public/screenshots (not referenced by site pages):');
  extra.forEach((f) => console.error('  ', f));
  process.exit(1);
}

if (missing.length) {
  console.error('Missing referenced public/screenshots:');
  missing.forEach((f) => console.error('  ', f));
  process.exit(1);
}

console.log(`public/screenshots OK (${allowed.size} referenced PNGs).`);
