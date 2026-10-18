/**
 * Copy marketing PNGs to agent store + split full-page DE 1440 + verify + index.md
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
import {
  auditPngFile,
  labelsEmbedSkipRects,
} from './marketing-blue-pixel-audit.mjs';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const qaDir = join(siteRoot, 'qa-screenshots');
const publicDir = join(siteRoot, 'public', 'screenshots');
const storeDir = process.env.LANDING_R7_STORE ?? '/cursor/stores/self/landing-r7';
const mobilePartPattern = /^landing-(de|en)-390-(light|dark)-part[1-4]\.png$/;
const captureSha =
  process.env.CAPTURE_GIT_SHA ?? execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

mkdirSync(storeDir, { recursive: true });

const landingFiles = [
  'landing-de-1440-light.png',
  'landing-de-1440-dark.png',
  'landing-en-1440-light.png',
  'landing-en-1440-dark.png',
  'landing-de-390-light.png',
  'landing-de-390-dark.png',
  'landing-en-390-light.png',
  'landing-en-390-dark.png',
  'landing-de-390-mobile-menu-light.png',
  'landing-de-390-mobile-menu-dark.png',
  'landing-de-390-mobile-menu.png',
  'landing-de-faq-open-light.png',
  'impressum-de-1440-light.png',
];

for (const base of ['landing-de-390-light', 'landing-de-390-dark', 'landing-en-390-light', 'landing-en-390-dark']) {
  for (let part = 1; part <= 4; part += 1) {
    landingFiles.push(`${base}-part${part}.png`);
  }
}

const embedPrefixes = ['hero-', 'library-', 'fields-', 'labels-', 'folders-', 'chat-'];
const embedFiles = readdirSync(publicDir).filter(
  (f) => f.endsWith('.png') && embedPrefixes.some((p) => f.startsWith(p))
);

function resolveSrc(name) {
  const qa = join(qaDir, name);
  if (statSync(qa, { throwIfNoEntry: false })) return qa;
  return join(publicDir, name);
}

function splitFullPage(baseName) {
  const src = resolveSrc(baseName);
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

function copyIntoStore(name) {
  copyFileSync(resolveSrc(name), join(storeDir, name));
}

for (const f of [...landingFiles, ...embedFiles]) {
  const p = resolveSrc(f);
  if (!statSync(p, { throwIfNoEntry: false })) {
    console.warn('Missing', f);
    continue;
  }
  copyIntoStore(f);
}

const splitParts = {
  'landing-de-1440-light.png': splitFullPage('landing-de-1440-light.png'),
  'landing-de-1440-dark.png': splitFullPage('landing-de-1440-dark.png'),
};

function blueAuditOptions(fileName) {
  const png = PNG.sync.read(readFileSync(join(storeDir, fileName)));
  const { width, height } = png;
  if (fileName.startsWith('labels-')) {
    return { skipRectangles: labelsEmbedSkipRects(width, height) };
  }
  if (fileName.startsWith('fields-')) {
    return {
      skipRectangles: [{ x: 0, y: Math.floor(height * 0.42), w: width, h: height - Math.floor(height * 0.42) }],
    };
  }
  return {};
}

const blueAuditFiles = [
  ...readdirSync(storeDir).filter(
    (f) =>
      f.endsWith('.png') &&
      (embedPrefixes.some((p) => f.startsWith(p)) ||
        /^landing-de-1440-(light|dark)-part1\.png$/.test(f) ||
        f === 'landing-de-390-mobile-menu-dark.png')
  ),
].sort();

const blueReport = {};
for (const f of blueAuditFiles) {
  const p = join(storeDir, f);
  if (statSync(p, { throwIfNoEntry: false })) {
    blueReport[f] = auditPngFile(p, blueAuditOptions(f));
  }
}

const indexLines = [
  `# Landing R7 artifact store`,
  ``,
  `Captured from git \`${captureSha}\`.`,
  ``,
  `| File | Size (bytes) | mtime (UTC) |`,
  `|------|-------------:|-------------|`,
];

for (const name of readdirSync(storeDir).filter((f) => f.endsWith('.png')).sort()) {
  const st = statSync(join(storeDir, name));
  indexLines.push(`| ${name} | ${st.size} | ${st.mtime.toISOString()} |`);
}

indexLines.push('', '## Split parts (DE 1440 full page)', '');
for (const [base, parts] of Object.entries(splitParts)) {
  indexLines.push(`- \`${base}\`: ${parts.map((p) => `\`${p}\``).join(', ')}`);
}

indexLines.push(
  '',
  '## Old indigo chrome sample (OKLCH c≥0.085, h 230–285°)',
  '',
  'All marketing embed PNGs (light + dark) plus landing hero splits; `labels-*` skips lower region (user label chip colours).',
  ''
);
for (const f of blueAuditFiles) {
  const hits = blueReport[f] ?? [];
  indexLines.push(`### ${f}`);
  if (f.startsWith('labels-')) {
    indexLines.push('- scan excludes user label chip region (lower ~58%)');
  }
  if (f.startsWith('fields-')) {
    indexLines.push('- scan excludes document preview region (lower ~58%)');
  }
  if (hits.length === 0) indexLines.push('- clean (no blue/teal chrome sampled)');
  else hits.forEach((h) => indexLines.push(`- (${h.x},${h.y}) hue ${h.hueDeg}° c ${h.c}`));
}

indexLines.push('', '## Footer legal routes', '');
indexLines.push('- Impressum → `/impressum` (DE) / `/en/impressum` — fields from `legal.config.json`; empty → “Noch nicht hinterlegt” / “Not provided yet”');
indexLines.push('- Datenschutz → `/datenschutz` (DE) / `/en/datenschutz` — same placeholder pattern');
indexLines.push('- `publish-pages.sh` with `PUBLISH=1` runs `check-legal-for-publish.mjs` (blocks empty imprint + placeholder HTML)');

indexLines.push('', '## Content checks', '');
indexLines.push('- Em/en dash grep `de.ts`/`en.ts`: run separately in CI');
indexLines.push('- Product title: inspect `landing-de-1440-light-part1.png` hero cards');

writeFileSync(join(storeDir, 'index.md'), `${indexLines.join('\n')}\n`);
writeFileSync(
  join(storeDir, 'capture-sha.txt'),
  `${captureSha}\n${createHash('sha256').update(captureSha).digest('hex')}\n`
);

console.log('Store populated at', storeDir);
console.log('Files:', readdirSync(storeDir).length);
console.log('Blue/teal hits:', JSON.stringify(blueReport, null, 2));
