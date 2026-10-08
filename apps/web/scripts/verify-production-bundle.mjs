import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const forbidden = ['SCREENSHOT_DEMO', 'installScreenshotDemoFetch', 'screenshotSeed'];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.js')) files.push(p);
  }
  return files;
}

const hits = [];
for (const file of walk(distDir)) {
  const text = readFileSync(file, 'utf8');
  for (const needle of forbidden) {
    if (text.includes(needle)) hits.push({ file, needle });
  }
}

if (hits.length) {
  console.error('Forbidden screenshot-demo strings in production dist:', hits);
  process.exit(1);
}
console.log('Production dist has no screenshot-demo artifacts.');
