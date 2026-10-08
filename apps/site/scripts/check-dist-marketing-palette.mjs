/**
 * Fail if built marketing CSS/HTML embeds legacy indigo or Scalar default accent hex
 * on pages that should use c1 (including /docs/api once overrides are applied).
 */
import { readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const distRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const legacyIndigo = [/#2f3e8c/i, /#253274/i, /#3d4fa8/i, /#3b82f6/i];
const scalarDefaultBlue = [/#0099ff/i, /#2b8cff/i, /#007bff/i];

/** Matches scalar-site-overrides.css (comment may be dropped by minifiers). */
const SCALAR_OVERRIDE_NEEDLE = '.scalar-embed-light .scalar-app';

function readDocsApiStylesheet() {
  const apiHtmlPath = join(distRoot, 'docs', 'api', 'index.html');
  if (!statSync(apiHtmlPath, { throwIfNoEntry: false })) {
    return null;
  }
  const html = readFileSync(apiHtmlPath, 'utf8');
  const m = html.match(/href="(\/assets\/[^"]+\.css)"/);
  if (!m) return null;
  return join(distRoot, m[1].replace(/^\//, ''));
}

function collectMarketingFiles() {
  const acc = [];
  const indexHtml = readFileSync(join(distRoot, 'index.html'), 'utf8');
  const cssRefs = [...indexHtml.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((m) =>
    join(distRoot, m[1].replace(/^\//, ''))
  );
  acc.push(...cssRefs);
  for (const rel of [
    'index.html',
    'impressum/index.html',
    'datenschutz/index.html',
    'en/impressum/index.html',
    'en/datenschutz/index.html',
  ]) {
    const p = join(distRoot, rel);
    if (statSync(p, { throwIfNoEntry: false })) acc.push(p);
  }
  return acc;
}

const hits = [];

for (const file of collectMarketingFiles()) {
  const text = readFileSync(file, 'utf8');
  for (const re of legacyIndigo) {
    if (re.test(text)) {
      hits.push(`${file}: ${re}`);
    }
  }
}

const apiCss = readDocsApiStylesheet();
if (apiCss && statSync(apiCss, { throwIfNoEntry: false })) {
  const css = readFileSync(apiCss, 'utf8');
  const markerIdx = css.indexOf(SCALAR_OVERRIDE_NEEDLE);
  if (markerIdx === -1) {
    hits.push(`${apiCss}: missing Scalar c1 override selectors (${SCALAR_OVERRIDE_NEEDLE})`);
  } else {
    const overrides = css.slice(markerIdx);
    if (!/#cb3a00/i.test(overrides) || !/#e96f49/i.test(overrides)) {
      hits.push(`${apiCss}: scalar overrides missing c1 accent hex`);
    }
    for (const re of scalarDefaultBlue) {
      if (re.test(overrides)) {
        hits.push(`${apiCss}: scalar override section contains default blue ${re}`);
      }
    }
  }
} else {
  hits.push('docs/api stylesheet: not found in dist');
}

if (hits.length) {
  console.error('Marketing dist palette check failed:\n' + hits.join('\n'));
  process.exit(1);
}
console.log(
  'Marketing dist palette OK (no legacy indigo on landing/legal; /docs/api has c1 Scalar overrides).'
);
