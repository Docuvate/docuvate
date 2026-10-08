#!/usr/bin/env node
/**
 * Renders every ```mermaid block in *.md via @mermaid-js/mermaid-cli (mmdc).
 * CLI is invoked on demand (pnpm dlx) so puppeteer is not a workspace dependency.
 */
import { execFileSync } from 'node:child_process';
import {
  accessSync,
  constants,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

/** Pinned for reproducible CI and local checks (matches lint-test puppeteer install). */
const MERMAID_CLI_VERSION = '11.12.0';

const ROOT = join(import.meta.dirname, '../..');
const blockRe = /```mermaid\r?\n([\s\S]*?)```/g;

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.nx',
  'tmp',
  'coverage',
  'ci-report',
]);

function shouldSkipDirectory(absDir) {
  const rel = relative(ROOT, absDir);
  if (rel === '' || rel === '.') {
    return false;
  }
  const parts = rel.split(/[/\\]/);
  for (const part of parts) {
    if (SKIP_DIR_NAMES.has(part)) {
      return true;
    }
  }
  if (rel.startsWith('apps/site/dist') || rel.startsWith('apps/site/.astro')) {
    return true;
  }
  return false;
}

function resolveChromeExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  for (const candidate of [
    '/usr/local/bin/google-chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ]) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // try next
    }
  }
  return undefined;
}

const chromeExecutable = resolveChromeExecutable();
const mmdcEnv = chromeExecutable
  ? { ...process.env, PUPPETEER_EXECUTABLE_PATH: chromeExecutable }
  : process.env;

function walkMarkdown(dir, out) {
  if (shouldSkipDirectory(dir)) {
    return;
  }
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      walkMarkdown(p, out);
    } else if (name.endsWith('.md')) {
      out.push(p);
    }
  }
}

function runMmdc(inputPath, outputPath) {
  execFileSync(
    'pnpm',
    [
      'dlx',
      `@mermaid-js/mermaid-cli@${MERMAID_CLI_VERSION}`,
      '-i',
      inputPath,
      '-o',
      outputPath,
      '-b',
      'transparent',
    ],
    {
      stdio: 'pipe',
      encoding: 'utf8',
      env: mmdcEnv,
      cwd: ROOT,
    },
  );
}

const mdFiles = [];
walkMarkdown(ROOT, mdFiles);

let failures = 0;
let blockCount = 0;
const tmpBase = mkdtempSync(join(tmpdir(), 'docuvate-mermaid-'));

for (const file of mdFiles) {
  const text = readFileSync(file, 'utf8');
  let match;
  let index = 0;
  blockRe.lastIndex = 0;
  while ((match = blockRe.exec(text)) !== null) {
    index += 1;
    blockCount += 1;
    const rel = relative(ROOT, file);
    const id = `${rel.replace(/[^\w.-]+/g, '_')}-${index}`;
    const input = join(tmpBase, `${id}.mmd`);
    const output = join(tmpBase, `${id}.svg`);
    writeFileSync(input, `${match[1].trimEnd()}\n`, 'utf8');
    try {
      runMmdc(input, output);
    } catch (err) {
      failures += 1;
      const msg = err.stderr?.toString?.() ?? err.message ?? String(err);
      console.error(`FAIL ${rel} block ${index}:\n${msg}`);
    }
  }
}

rmSync(tmpBase, { recursive: true, force: true });

if (blockCount === 0) {
  console.error('No mermaid blocks found in *.md');
  process.exit(1);
}

if (failures > 0) {
  console.error(`${failures}/${blockCount} mermaid block(s) failed`);
  process.exit(1);
}

console.log(`OK: ${blockCount} mermaid block(s) in ${mdFiles.length} markdown file(s)`);
