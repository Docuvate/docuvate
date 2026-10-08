import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(siteRoot, 'legal.config.json'), 'utf8'));

const IMPRINT_PLACEHOLDER_MARKERS = ['Noch nicht hinterlegt', 'Not provided yet'];

const required = [
  'providerName',
  'street',
  'postalCode',
  'city',
  'country',
  'email',
];

const missing = required.filter((key) => !String(config.imprint?.[key] ?? '').trim());

if (missing.length > 0) {
  console.error(
    'Refusing publish: legal.config.json imprint fields empty:',
    missing.join(', ')
  );
  console.error('Fill apps/site/legal.config.json before PUBLISH=1.');
  process.exit(1);
}

const distRoot = process.env.SITE_DIST ?? join(siteRoot, 'dist');
if (statSync(distRoot, { throwIfNoEntry: false })?.isDirectory()) {
  const imprintHtmlPaths = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (name === 'index.html' && full.includes(`${join('impressum', 'index.html')}`)) {
        imprintHtmlPaths.push(full);
      } else if (name.endsWith('.html') && /impressum/i.test(full)) {
        imprintHtmlPaths.push(full);
      }
    }
  }
  walk(distRoot);

  for (const htmlPath of imprintHtmlPaths) {
    const html = readFileSync(htmlPath, 'utf8');
    for (const marker of IMPRINT_PLACEHOLDER_MARKERS) {
      if (html.includes(marker)) {
        console.error(
          `Refusing publish: imprint HTML still contains placeholder "${marker}" (${htmlPath})`
        );
        process.exit(1);
      }
    }
  }
}

console.log('Legal imprint config OK for publish.');
