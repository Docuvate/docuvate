#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const LOGO_DIR = path.join(ROOT, 'docs/assets/logo');

async function rasterizeSvg(relativeSvg, outFile, width, height, background) {
  const svgPath = path.join(LOGO_DIR, relativeSvg);
  const svg = await readFile(svgPath, 'utf8');
  const html = `<!DOCTYPE html><html><body style="margin:0;background:${background}">
<style>html,body{width:${width}px;height:${height}px;overflow:hidden;display:flex;align-items:center;justify-content:center}</style>
${svg.replace('<svg', `<svg width="${width}" height="${height}"`)}
</body></html>`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outFile, type: 'png' });
  await browser.close();
}

async function socialPreview() {
  const logo = await readFile(path.join(LOGO_DIR, 'logo-dark.svg'), 'utf8');
  const html = `<!DOCTYPE html><html><body style="margin:0;width:1280px;height:640px;background:linear-gradient(135deg,#1e1a13 0%,#2a241a 45%,#cb3a00 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;color:#f5f1ea">
${logo.replace('<svg', '<svg width="420" height="84"')}
<p style="margin:28px 0 0;font-size:28px;font-weight:500;color:#f5f1ea;max-width:900px;text-align:center;line-height:1.35;opacity:0.92">Self-hosted document intelligence: OCR, auto-labeling, search and chat over your documents, on your own hardware.</p>
</body></html>`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({
    path: path.join(LOGO_DIR, 'social-preview.png'),
    type: 'png',
  });
  await browser.close();
}

async function main() {
  await mkdir(LOGO_DIR, { recursive: true });
  await rasterizeSvg('logo-light.svg', path.join(LOGO_DIR, 'logo-1024.png'), 1024, 1024, '#f5f1e9');
  await socialPreview();
  console.log('Wrote logo-1024.png and social-preview.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
