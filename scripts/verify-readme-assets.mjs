#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = path.resolve(import.meta.dirname, '..');
const README_TOOLS = path.join(ROOT, 'tools/readme');
const UNICODE_DASH = /[\u2013\u2014]/;

function extractMarkdownPaths(md) {
  const imgs = [...md.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)].map((m) => m[1].split(/\s/)[0]);
  const links = [...md.matchAll(/(?<!!)\[[^\]]*]\(([^)]+)\)/g)].map((m) => m[1].split(/\s/)[0]);
  return { imgs, links };
}

function extractHtmlAssetPaths(md) {
  const paths = [];
  for (const m of md.matchAll(/\bsrc="([^"]+)"/g)) paths.push(m[1].split(/\s/)[0]);
  for (const m of md.matchAll(/\bsrcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      paths.push(url);
    }
  }
  return paths;
}

function stripFencedCode(md) {
  return md.replace(/```[\s\S]*?```/g, '');
}

function fencedCodeBlocks(md) {
  return [...md.matchAll(/```[\s\S]*?```/g)].map((m) => m[0]);
}

async function checkReadme(file) {
  const md = await readFile(path.join(ROOT, file), 'utf8');
  const hero = md.split('\n').slice(0, 35).join('\n');
  const errors = [];
  const prose = stripFencedCode(md);
  if (UNICODE_DASH.test(prose)) errors.push(`${file}: em/en dash in customer text (outside code fences)`);
  for (const block of fencedCodeBlocks(md)) {
    if (UNICODE_DASH.test(block)) {
      errors.push(`${file}: U+2013/U+2014 in fenced code block (use ASCII hyphen-minus)`);
    }
  }
  if (/EHW\+/i.test(md)) errors.push(`${file}: EHW+ found`);
  if (/\/v1/.test(hero)) errors.push(`${file}: /v1 in hero/header block`);
  const paths = [
    ...extractMarkdownPaths(md).imgs,
    ...extractHtmlAssetPaths(md),
  ];
  for (const rel of paths) {
    if (!rel || rel.startsWith('http') || rel.startsWith('#') || rel.startsWith('data:')) continue;
    const clean = rel.replace(/^\.\//, '');
    const p = path.join(ROOT, clean);
    if (!existsSync(p)) errors.push(`${file}: missing asset ${rel}`);
  }
  const { links } = extractMarkdownPaths(md);
  for (const rel of links) {
    if (rel.startsWith('http') || rel.startsWith('mailto:') || rel.startsWith('#')) continue;
    const clean = rel.replace(/#.*$/, '');
    if (!clean) continue;
    const p = path.join(ROOT, clean);
    if (!existsSync(p)) errors.push(`${file}: missing link target ${rel}`);
  }
  return errors;
}

async function main() {
  const all = [...(await checkReadme('README.md')), ...(await checkReadme('README.de.md'))];
  for (const name of [
    'export-logo-assets.mjs',
    'render-readme-preview.mjs',
    'seed-readme-screenshots.mjs',
    'capture-readme-screenshots.mjs',
  ]) {
    if (!existsSync(path.join(README_TOOLS, name))) {
      all.push(`missing tools/readme/${name}`);
    }
  }
  const social = path.join(ROOT, 'docs/assets/logo/social-preview.png');
  if (!existsSync(social)) {
    all.push('missing social-preview.png');
  } else {
    const png = await readFile(social);
    if (png.length < 8) all.push('invalid social-preview.png');
    const w = png.readUInt32BE(16);
    const h = png.readUInt32BE(20);
    if (w !== 1280 || h !== 640) all.push(`social-preview.png size ${w}x${h}, expected 1280x640`);
  }
  if (all.length) {
    console.error(all.join('\n'));
    process.exit(1);
  }
  console.log('verify-readme-assets: ok');
}

main();
