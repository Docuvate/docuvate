import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(WEB_ROOT, 'src');
const EXT = new Set(['.ts', '.tsx']);

const BANNED_IN_LABELS_COPY =
  /\b(embedding|embeddings|cosinus|cosine|vektor|vector|labelraum|zentrum|centroid)\b/i;

const SCOPED_PREFIXES = ['labels.', 'labelRecommendations.', 'errors.labels'];

function isScopedKey(key) {
  return SCOPED_PREFIXES.some((p) => key.startsWith(p));
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'i18n') continue;
      walk(full, out);
    } else if (EXT.has(path.extname(ent.name)) && !ent.name.includes('.spec.')) {
      out.push(full);
    }
  }
  return out;
}

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else if (typeof v === 'string') {
      out[key] = v;
    }
  }
  return out;
}

function loadLocale(name) {
  const file = path.join(SRC, 'i18n', 'locales', `${name}.json`);
  return flatten(JSON.parse(fs.readFileSync(file, 'utf8')));
}

function hasTranslation(flat, key) {
  if (flat[key] != null) return true;
  if (flat[`${key}_one`] != null && flat[`${key}_other`] != null) return true;
  if (flat[`${key}_zero`] != null) return true;
  return false;
}

function extractKeysFromSource(src) {
  const keys = new Set();
  for (const m of src.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) {
    keys.add(m[1]);
  }
  for (const m of src.matchAll(/labelKey:\s*['"]([^'"]+)['"]/g)) {
    keys.add(m[1]);
  }
  for (const m of src.matchAll(/return\s+['"]((?:labels|labelRecommendations|errors|common)\.[^'"]+)['"]/g)) {
    keys.add(m[1]);
  }
  return keys;
}

function extractPluralKeys(src) {
  const plural = new Set();
  for (const m of src.matchAll(/\bt\(\s*['"]([^'"]+)['"]\s*,\s*\{[^}]*\bcount\b/g)) {
    plural.add(m[1]);
  }
  return plural;
}

const de = loadLocale('de');
const en = loadLocale('en');
const usedKeys = new Set();
const usedPlural = new Set();

for (const file of walk(SRC)) {
  const src = fs.readFileSync(file, 'utf8');
  for (const k of extractKeysFromSource(src)) usedKeys.add(k);
  for (const k of extractPluralKeys(src)) usedPlural.add(k);
}

const missing = [];
for (const key of [...usedKeys].sort()) {
  if (!isScopedKey(key)) continue;
  if (!hasTranslation(de, key) || !hasTranslation(en, key)) {
    missing.push(key);
  }
}

const pluralMissing = [];
for (const key of [...usedPlural].sort()) {
  if (!isScopedKey(key)) continue;
  if (de[`${key}_one`] == null || de[`${key}_other`] == null) pluralMissing.push(`de:${key}`);
  if (en[`${key}_one`] == null || en[`${key}_other`] == null) pluralMissing.push(`en:${key}`);
}

const jargon = [];
for (const [key, text] of Object.entries(de)) {
  if (!key.startsWith('labels.')) continue;
  if (BANNED_IN_LABELS_COPY.test(text)) jargon.push(`de ${key}: ${text.slice(0, 80)}`);
}
for (const [key, text] of Object.entries(en)) {
  if (!key.startsWith('labels.')) continue;
  if (BANNED_IN_LABELS_COPY.test(text)) jargon.push(`en ${key}: ${text.slice(0, 80)}`);
}

let failed = false;
if (missing.length) {
  failed = true;
  console.error('Missing i18n keys (de/en):');
  for (const k of missing) console.error(`  ${k}`);
}
if (pluralMissing.length) {
  failed = true;
  console.error('Missing plural forms (_one/_other):');
  for (const k of pluralMissing) console.error(`  ${k}`);
}
if (jargon.length) {
  failed = true;
  console.error('Banned jargon in labels.* copy:');
  for (const j of jargon) console.error(`  ${j}`);
}

if (failed) process.exit(1);
console.log(`i18n key check OK (${usedKeys.size} keys, ${usedPlural.size} plural)`);
