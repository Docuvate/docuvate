/**
 * R8 QA store: landing + legal full-page captures at current HEAD.
 */
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { execSync } from 'node:child_process';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(siteRoot, 'qa-screenshots');
const storeDir = process.env.LANDING_R8_STORE ?? '/cursor/stores/self/landing-r8';
const captureSha =
  process.env.CAPTURE_GIT_SHA ?? execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

mkdirSync(storeDir, { recursive: true });

const landingFiles = [
  'landing-de-1440-light.png',
  'landing-de-1440-dark.png',
  'landing-de-390-light.png',
  'impressum-de-1440-light.png',
  'impressum-de-1440-dark.png',
  'datenschutz-de-1440-light.png',
  'legal-en-1440-light.png',
];

function splitFullPage(baseName) {
  const src = join(srcDir, baseName);
  const buf = readFileSync(src);
  const png = PNG.sync.read(buf);
  const partH = 1600;
  const parts = [];
  for (let y = 0, part = 1; y < png.height; y += partH, part += 1) {
    const h = Math.min(partH, png.height - y);
    const slice = new PNG({ width: png.width, height: h });
    for (let row = 0; row < h; row += 1) {
      png.data.copy(slice.data, row * png.width * 4, ((y + row) * png.width) << 2, ((y + row + 1) * png.width) << 2);
    }
    const stem = baseName.replace(/\.png$/, '');
    const outName = `${stem}-part${part}.png`;
    writeFileSync(join(storeDir, outName), PNG.sync.write(slice));
    parts.push(outName);
  }
  return parts;
}

for (const f of landingFiles) {
  const p = join(srcDir, f);
  if (!statSync(p, { throwIfNoEntry: false })) {
    throw new Error(`Missing capture: ${f}`);
  }
  copyFileSync(p, join(storeDir, f));
}

const splitParts = {
  'landing-de-1440-light.png': splitFullPage('landing-de-1440-light.png'),
  'landing-de-1440-dark.png': splitFullPage('landing-de-1440-dark.png'),
};

const indexLines = [
  '# Landing R8 artifact store',
  '',
  `Captured from git \`${captureSha}\`.`,
  '',
  '| File | Size (bytes) | mtime (UTC) |',
  '|------|-------------:|-------------|',
];

for (const name of readdirSync(storeDir).filter((f) => f.endsWith('.png')).sort()) {
  const st = statSync(join(storeDir, name));
  indexLines.push(`| ${name} | ${st.size} | ${st.mtime.toISOString()} |`);
}

indexLines.push('', '## Split parts (DE 1440)', '');
for (const [base, parts] of Object.entries(splitParts)) {
  indexLines.push(`- \`${base}\`: ${parts.map((p) => `\`${p}\``).join(', ')}`);
}

writeFileSync(join(storeDir, 'index.md'), `${indexLines.join('\n')}\n`);
writeFileSync(
  join(storeDir, 'capture-sha.txt'),
  `${captureSha}\n${createHash('sha256').update(captureSha).digest('hex')}\n`
);

console.log('R8 store populated at', storeDir);
