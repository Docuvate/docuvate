import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteRoot = join(fileURLToPath(import.meta.url), '..', '..');
const clientDir = join(siteRoot, 'dist', 'client');
const serverEntry = join(siteRoot, 'dist', 'server', 'entry-server.js');
const template = readFileSync(join(clientDir, 'index.html'), 'utf8');

const { render, prerenderRoutes } = await import(pathToFileURL(serverEntry).href);

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    if (statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      cpSync(s, d);
    }
  }
}

const outDir = join(siteRoot, 'dist');
mkdirSync(outDir, { recursive: true });

for (const route of prerenderRoutes) {
  const { html, helmet } = render(route);
  let doc = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  if (helmet.title) {
    doc = doc.replace(/<title>[^<]*<\/title>/, `<title>${helmet.title}</title>`);
  }
  if (helmet.description) {
    if (doc.includes('name="description"')) {
      doc = doc.replace(
        /content="[^"]*" name="description"/,
        `content="${helmet.description}" name="description"`
      );
    } else {
      doc = doc.replace('</head>', `  <meta name="description" content="${helmet.description}" />\n</head>`);
    }
  }
  if (helmet.lang) {
    doc = doc.replace('<html lang="de">', `<html lang="${helmet.lang}">`);
  }

  const filePath =
    route === '/'
      ? join(outDir, 'index.html')
      : join(outDir, route.replace(/^\//, ''), 'index.html');
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, doc);
}

for (const entry of readdirSync(clientDir)) {
  if (entry === 'index.html') continue;
  const s = join(clientDir, entry);
  const d = join(outDir, entry);
  if (statSync(s).isDirectory()) {
    copyDir(s, d);
  } else {
    cpSync(s, d);
  }
}

console.log(`Prerendered ${prerenderRoutes.length} routes to ${outDir}`);
