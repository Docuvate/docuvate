#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIN_DARK_MEAN_LUMINANCE = 0;
const MAX_DARK_MEAN_LUMINANCE = 0.42;
const MIN_LIGHT_MEAN_LUMINANCE = 0.45;

function listPngFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) {
      continue;
    }
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith('.png')) {
        out.push(full);
      }
    }
  }
  return out.sort();
}

function md5File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex');
}

function relativeLuminanceChannel(channel) {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function meanLuminance(png) {
  let sum = 0;
  let count = 0;
  const { width, height, data } = png;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (width * y + x) << 2;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a === 0) {
        continue;
      }
      const lum =
        0.2126 * relativeLuminanceChannel(r) +
        0.7152 * relativeLuminanceChannel(g) +
        0.0722 * relativeLuminanceChannel(b);
      sum += lum;
      count += 1;
    }
  }
  if (count === 0) {
    return 0;
  }
  return sum / count;
}

function themeFromPath(filePath) {
  const normalized = filePath.split(path.sep).join('/');
  if (normalized.includes('/dark/')) {
    return 'dark';
  }
  if (normalized.includes('/light/')) {
    return 'light';
  }
  return null;
}

function main() {
  const rootDir = process.env.CONTRAST_SCREENSHOT_DIR ?? path.join(process.cwd(), 'contrast-screenshots');
  const files = listPngFiles(rootDir);
  if (files.length === 0) {
    console.error(`No PNG files under ${rootDir}`);
    process.exit(1);
  }

  const byHash = new Map();
  const failures = [];

  for (const filePath of files) {
    const hash = md5File(filePath);
    const prior = byHash.get(hash);
    if (prior) {
      failures.push(`Duplicate PNG hash ${hash}: ${prior} and ${filePath}`);
      continue;
    }
    byHash.set(hash, filePath);

    const png = PNG.sync.read(fs.readFileSync(filePath));
    const mean = meanLuminance(png);
    const theme = themeFromPath(filePath);
    if (theme === 'dark') {
      if (mean < MIN_DARK_MEAN_LUMINANCE || mean > MAX_DARK_MEAN_LUMINANCE) {
        failures.push(
          `Dark screenshot mean luminance out of range: ${mean.toFixed(3)} (${filePath}); expected <= ${MAX_DARK_MEAN_LUMINANCE}`
        );
      }
    } else if (theme === 'light') {
      if (mean < MIN_LIGHT_MEAN_LUMINANCE) {
        failures.push(
          `Light screenshot mean luminance too low: ${mean.toFixed(3)} (${filePath}); expected >= ${MIN_LIGHT_MEAN_LUMINANCE}`
        );
      }
    }
  }

  if (failures.length > 0) {
    console.error('Contrast screenshot verification failed:');
    for (const line of failures) {
      console.error(`  ${line}`);
    }
    process.exit(1);
  }

  console.log(`Contrast screenshot verification OK (${files.length} distinct PNGs)`);
}

main();
