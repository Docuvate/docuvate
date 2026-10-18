import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const EXT = new Set(['.tsx', '.jsx']);

/** Exact string allowlist (UI literals that stay in code). */
const ALLOW_EXACT = new Set([
  'Docuvate',
  'PDF',
  'OCR',
  'API',
  'OK',
  'SSE',
  'RAG',
  'JSON',
  'URL',
  'Markdown',
  'HTML',
  'CSS',
  'GPU',
  'CPU',
  'LLM',
  'Ollama',
  'Docling',
  'Paddle',
  'Donut',
  'MinIO',
  'Valkey',
  'SMTP',
  'TLS',
  'UTF-8',
  'ID',
  'UI',
  'UX',
  'N/A',
  '…',
  '→',
  '←',
]);

/** Regex: punctuation / numbers only. */
const PUNCT_ONLY = /^[\s\d·|/\\:.,!?%+\-()[\]{}'"`#@&*→←…]+$/;

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

function looksLikeCode(text) {
  if (text.length > 240) return true;
  if (/[;{}]|=>|\(\)|===|\?|\buse(State|Ref|Effect|Callback|Memo)\b|\bvoid\b|\bPromise\b|\bprops\.|\bfunction\b|\bconst\b|\breturn\b|\btype\b|\binterface\b/.test(text)) {
    return true;
  }
  if (/^\(|^\)|^\[|^\]$/.test(text.trim())) return true;
  if (/\bRefObject\b|\bHTML\w*Element\b/.test(text)) return true;
  if (/^,\s*\w+:/.test(text.trim())) return true;
  return false;
}

function isAllowedLiteral(text) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return true;
  if (looksLikeCode(trimmed)) return true;
  if (PUNCT_ONLY.test(trimmed)) return true;
  if (ALLOW_EXACT.has(trimmed)) return true;
  if (/^\{.*\}$/.test(trimmed)) return true;
  if (/^[a-z]+(-[a-z]+)+$/.test(trimmed)) return true;
  if (/^\/[\w/-]*$/.test(trimmed)) return true;
  if (!/[a-zA-Z]/.test(trimmed)) return true;
  return false;
}

function lineUsesI18n(src, index) {
  const start = Math.max(0, index - 120);
  const end = Math.min(src.length, index + 120);
  const window = src.slice(start, end);
  return /\bt\s*\(|useTranslation|i18n\.t/.test(window);
}

const violations = [];

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('eslint-disable') && src.includes('i18n-literals')) continue;

  for (const m of src.matchAll(/>([^<{][^<{}]{1,})</g)) {
    const text = m[1].trim();
    if (!text || text.includes('{')) continue;
    if (isAllowedLiteral(text)) continue;
    const idx = m.index ?? 0;
    if (lineUsesI18n(src, idx)) continue;
    violations.push({ file: rel, text, kind: 'jsx-text' });
  }

  for (const attr of ['placeholder', 'title', 'aria-label', 'alt']) {
    const re = new RegExp(`${attr}=["']([^"'{][^"']{1,})["']`, 'g');
    let m;
    while ((m = re.exec(src))) {
      const val = m[1];
      if (val.includes('{') || val.includes('${')) continue;
      if (isAllowedLiteral(val)) continue;
      if (lineUsesI18n(src, m.index)) continue;
      violations.push({ file: rel, text: val, kind: attr });
    }
  }
}

if (violations.length > 0) {
  console.error(`Hard-coded UI strings found (${violations.length}); use i18n:`);
  for (const v of violations.slice(0, 60)) {
    console.error(`  ${v.file} [${v.kind}]: ${v.text.slice(0, 100)}`);
  }
  if (violations.length > 60) {
    console.error(`  … and ${violations.length - 60} more`);
  }
  process.exit(1);
}

console.log('UI literal check OK');
