import { deContent } from '../src/content/de.ts';
import { enContent } from '../src/content/en.ts';

const ALLOW_IDENTICAL = new Set([
  '© 2026 Docuvate',
  'Docuvate Cloud / Business',
  'Docker Compose',
  'Paperless-ngx',
  'Home Assistant',
  'Microsoft Outlook',
  'Amazon S3',
  'Gmail',
  'GitHub',
  'Node.js',
  'PostgreSQL',
  'Valkey',
  'API',
  'SDKs',
  'Styles',
  'https://docuvate.de',
]);

const FORBIDDEN_IN_DE = [
  /\bOpen Source\b/i,
  /Self-hosted/i,
  /self-hosted document intelligence/i,
  /Document Intelligence/i,
  /Quickstart/i,
  /Runs on your hardware/i,
  /Honest by design/i,
  /Learn more/i,
  /Installation guide/i,
  /View source on GitHub/i,
  /On your hardware/i,
];

function collectStrings(value, out = []) {
  if (typeof value === 'string') {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectStrings(v, out);
  }
  return out;
}

/** User-facing DE marketing copy (exclude SDK code samples and integration ids). */
const deMarketing = {
  nav: deContent.nav,
  footer: deContent.footer,
  landing: deContent.landing,
  legal: deContent.legal,
};

const enMarketing = {
  nav: enContent.nav,
  footer: enContent.footer,
  landing: enContent.landing,
  legal: enContent.legal,
};

const deStrings = collectStrings(deMarketing);
const enStrings = new Set(collectStrings(enMarketing));
const errors = [];

for (const phrase of FORBIDDEN_IN_DE) {
  for (const s of deStrings) {
    if (phrase.test(s)) {
      errors.push(`DE forbidden phrase ${phrase}: "${s.slice(0, 80)}"`);
    }
  }
}

for (const s of deStrings) {
  if (s.length < 10 || !enStrings.has(s) || ALLOW_IDENTICAL.has(s)) continue;
  if (/[`@{}<>]/.test(s) || s.includes('import ') || /^[a-z0-9_]+$/.test(s)) continue;
  errors.push(`DE marketing string identical to EN: "${s.slice(0, 100)}"`);
}

const criticalPairs = [
  ['footer.tagline', deContent.footer.tagline, enContent.footer.tagline],
  ['landing.hero.eyebrow', deContent.landing.hero.eyebrow, enContent.landing.hero.eyebrow],
  ['landing.meta.description', deContent.landing.meta.description, enContent.landing.meta.description],
  ['landing.hero.lead', deContent.landing.hero.lead, enContent.landing.hero.lead],
];

for (const [path, de, en] of criticalPairs) {
  if (de === en) {
    errors.push(`${path} must differ between DE and EN`);
  }
}

if (errors.length > 0) {
  console.error('check-de-locale failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

console.log(`check-de-locale OK (${deStrings.length} DE marketing strings scanned)`);
