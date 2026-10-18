import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHighlighter } from 'shiki';
import { docuvateDark, docuvateLight } from './shiki-docuvate-themes.mjs';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const destDir = join(siteRoot, 'src', 'generated');

const json = execSync('node --import tsx scripts/export-code-snippets.ts', {
  cwd: siteRoot,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
});
const entries = JSON.parse(json);

const highlighter = await createHighlighter({
  themes: [docuvateLight, docuvateDark],
  langs: ['typescript', 'javascript', 'yaml', 'dart', 'shell', 'bash'],
});

const out = {};
for (const entry of entries) {
  const lang = entry.lang === 'javascript' ? 'typescript' : entry.lang;
  out[entry.key] = {
    light: highlighter.codeToHtml(entry.code, { lang, theme: 'docuvate-light' }),
    dark: highlighter.codeToHtml(entry.code, { lang, theme: 'docuvate-dark' }),
  };
}

mkdirSync(destDir, { recursive: true });
writeFileSync(join(destDir, 'code-highlights.json'), `${JSON.stringify(out)}\n`);
console.log('Wrote code-highlights.json with', Object.keys(out).length, 'entries');
