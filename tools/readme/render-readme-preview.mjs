#!/usr/bin/env node
import { chromium } from 'playwright';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = '/cursor/stores/self/readme-shots';

const MIME_BY_EXT = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
};

/** @param {string | undefined} sha */
function branchRawBase(sha) {
  if (!sha) return null;
  return `https://raw.githubusercontent.com/Docuvate/docuvate/${sha}/`;
}

function githubCss(mode) {
  const bg = mode === 'dark' ? '#0d1117' : '#ffffff';
  const fg = mode === 'dark' ? '#e6edf3' : '#1f2328';
  return `body{margin:0;padding:24px;background:${bg};color:${fg};font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5}
.markdown-body{box-sizing:border-box;max-width:980px;margin:0 auto}
.markdown-body img{max-width:100%}
.markdown-body table{border-collapse:collapse}
.markdown-body td,.markdown-body th{border:1px solid ${mode === 'dark' ? '#30363d' : '#d0d7de'};padding:6px 13px}
.markdown-body pre,.markdown-body code{font-variant-ligatures:none;font-feature-settings:"liga" 0,"calt" 0}`;
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
      const rel = urlPath.replace(/^\//, '') || 'README.md';
      const filePath = path.normalize(path.join(ROOT, rel));
      if (!filePath.startsWith(ROOT)) {
        res.statusCode = 403;
        res.end();
        return;
      }
      if (!existsSync(filePath)) {
        res.statusCode = 404;
        res.end();
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_BY_EXT[ext];
      if (mime) res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'no-store');
      createReadStream(filePath).on('error', () => {
        res.statusCode = 500;
        res.end();
      }).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('static server failed to bind'));
        return;
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}/` });
    });
  });
}

async function githubMarkdown(md, contextPath) {
  const res = await fetch('https://api.github.com/markdown', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/vnd.github+json',
      'user-agent': 'docuvate-readme-preview',
    },
    body: JSON.stringify({ text: md, mode: 'gfm', context: contextPath }),
  });
  if (!res.ok) {
    throw new Error(`GitHub markdown API ${res.status}: ${await res.text()}`);
  }
  return res.text();
}

/** Rewrite repo-relative asset URLs so they resolve against baseUrl (local static or raw.githubusercontent.com). */
function rewriteAssetUrls(html, baseUrl) {
  const join = (url) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const clean = url.replace(/^\.\//, '');
    return `${baseUrl}${clean}`;
  };
  return html.replace(/\b(src|srcset|href)="([^"]+)"/g, (match, attr, value) => {
    if (attr === 'href' && (value.startsWith('#') || value.startsWith('http'))) return match;
    if (attr === 'srcset') {
      const rewritten = value
        .split(',')
        .map((part) => {
          const trimmed = part.trim();
          const space = trimmed.indexOf(' ');
          if (space === -1) return join(trimmed);
          return `${join(trimmed.slice(0, space))}${trimmed.slice(space)}`;
        })
        .join(', ');
      return `srcset="${rewritten}"`;
    }
    if (attr === 'src' || attr === 'href') return `${attr}="${join(value)}"`;
    return match;
  });
}

async function assertImagesLoaded(page, label) {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    for (const img of document.querySelectorAll('img')) {
      const src = img.src || '';
      if (src.includes('shields.io')) continue;
      if (!img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) return false;
    }
    return true;
  });
  const broken = await page.evaluate(() => {
    const bad = [];
    for (const img of document.querySelectorAll('img')) {
      const src = img.src || '';
      if (src.includes('shields.io')) continue;
      if (!img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
        bad.push(`${img.alt || '(img)'}: ${src} (${img.naturalWidth}x${img.naturalHeight}, complete=${img.complete})`);
      }
    }
    return bad;
  });
  if (broken.length) {
    throw new Error(`${label}: broken images: ${broken.join('; ')}`);
  }
  const logo = await page.evaluate(() => {
    const img = document.querySelector('picture img');
    if (!img) return null;
    return { w: img.naturalWidth, h: img.naturalHeight, src: img.currentSrc || img.src };
  });
  if (!logo || logo.w <= 0) {
    throw new Error(`${label}: logo picture img not loaded`);
  }
  console.log(`${label}: logo ${logo.w}x${logo.h} (${logo.src}); all repo images OK`);
}

async function renderMarkdown(htmlBody, mode, width, outPath, assetBase) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width, height: 1200 },
    colorScheme: mode,
  });
  await page.emulateMedia({ colorScheme: mode });
  const body = rewriteAssetUrls(htmlBody, assetBase);
  await page.setContent(
    `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>${githubCss(mode)}</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.6.1/github-markdown${mode === 'dark' ? '-dark' : ''}.min.css"/>
</head><body><article class="markdown-body">${body}</article></body></html>`,
    { waitUntil: 'domcontentloaded' }
  );
  await assertImagesLoaded(page, path.basename(outPath));
  await page.screenshot({ path: outPath, fullPage: true, type: 'png' });
  await browser.close();
}

async function renderFile(relativeMd, prefix, assetBase) {
  const md = await readFile(path.join(ROOT, relativeMd), 'utf8');
  const html = await githubMarkdown(md, `Docuvate/docuvate/${relativeMd}`);
  for (const width of [1280, 390]) {
    await renderMarkdown(html, 'light', width, path.join(OUT, `${prefix}-light-${width}.png`), assetBase);
    await renderMarkdown(html, 'dark', width, path.join(OUT, `${prefix}-dark-${width}.png`), assetBase);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const sha = process.env.README_RENDER_SHA?.trim();
  const rawBase = branchRawBase(sha);
  let assetBase = rawBase;
  let server = null;
  if (!assetBase) {
    const started = await startStaticServer();
    server = started.server;
    assetBase = started.baseUrl;
    console.log(`Asset base (local): ${assetBase}`);
  } else {
    console.log(`Asset base (raw): ${assetBase}`);
  }
  try {
    await renderFile('README.md', 'readme', assetBase);
    await renderFile('README.de.md', 'readme-de', assetBase);
  } finally {
    server?.close();
  }
  console.log(`README previews in ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
