// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(webRoot, 'assets', 'error-scenes-source');
const outDir = path.join(webRoot, 'public', 'error-scenes');

const storeArg = process.argv[2];
const storePath =
  storeArg != null && storeArg.length > 0
    ? storeArg
    : path.join('/cursor/stores/self/artifacts/error-scenes-v2', 'colour-check.png');

const CROP = { left: 0.22, top: 0.38, width: 0.56, height: 0.34 };

async function main() {
  const jpegPath = path.join(sourceDir, 'unreachable.jpg');
  const webpPath = path.join(outDir, 'unreachable', 'unreachable-1440.webp');

  const metaJ = await sharp(jpegPath).metadata();
  const metaW = await sharp(webpPath).metadata();
  if (metaJ.width == null || metaJ.height == null || metaW.width == null || metaW.height == null) {
    throw new Error('Missing image dimensions for colour check');
  }

  const cropJ = {
    left: Math.round(metaJ.width * CROP.left),
    top: Math.round(metaJ.height * CROP.top),
    width: Math.round(metaJ.width * CROP.width),
    height: Math.round(metaJ.height * CROP.height),
  };
  const cropW = {
    left: Math.round(metaW.width * CROP.left),
    top: Math.round(metaW.height * CROP.top),
    width: Math.round(metaW.width * CROP.width),
    height: Math.round(metaW.height * CROP.height),
  };

  const sourceCrop = await sharp(jpegPath).extract(cropJ).resize(640, 360, { fit: 'fill' }).png().toBuffer();
  const builtCrop = await sharp(webpPath).extract(cropW).resize(640, 360, { fit: 'fill' }).png().toBuffer();

  const labelH = 36;
  const pad = 16;
  const sheetW = 640 * 2 + pad * 3;
  const sheetH = 360 + labelH + pad * 2;

  const labels = await sharp({
    create: {
      width: sheetW,
      height: labelH,
      channels: 4,
      background: { r: 32, g: 28, b: 24, alpha: 255 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${String(sheetW)}" height="${String(labelH)}" xmlns="http://www.w3.org/2000/svg">
            <text x="16" y="24" fill="#f5f1ea" font-family="system-ui,sans-serif" font-size="14">Source JPEG (unreachable)</text>
            <text x="${String(640 + pad * 2)}" y="24" fill="#f5f1ea" font-family="system-ui,sans-serif" font-size="14">Built WebP 1440w</text>
          </svg>`
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 4,
      background: { r: 32, g: 28, b: 24, alpha: 255 },
    },
  })
    .composite([
      { input: labels, top: pad, left: 0 },
      { input: sourceCrop, top: pad + labelH, left: pad },
      { input: builtCrop, top: pad + labelH, left: pad * 2 + 640 },
    ])
    .png()
    .toFile(storePath);

  console.log(`Wrote ${storePath}`);
}

await main();
