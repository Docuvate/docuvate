// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(webRoot, 'assets', 'error-scenes-source');
const outDir = path.join(webRoot, 'public', 'error-scenes');
const manifestPath = path.join(webRoot, 'src', 'components', 'errors', 'errorSceneManifest.generated.ts');

const WIDTHS = [480, 960, 1440];
const EDGE_BAND_PX = 2;
/** Cream backdrop from source art; used only on semi-transparent edge pixels. */
const MATTE_BG = { r: 245, g: 241, b: 233 };
const MAX_STROKE_DELTA_E = 5;
const MAX_STROKE_DELTA_E_JPEG = 8;

const SCENES = [
  { id: 'unexpected', file: 'mascot-base.png', slug: 'mascot-base', jpeg: 'mascot-base.jpg' },
  { id: 'unreachable', file: 'unreachable.png', slug: 'unreachable', jpeg: 'unreachable.jpg' },
  { id: 'offline', file: 'offline.png', slug: 'offline', jpeg: 'offline.jpg' },
  { id: 'notFound', file: 'not-found.png', slug: 'not-found', jpeg: 'not-found.jpg' },
  { id: 'serverFault', file: 'server-error.png', slug: 'server-error', jpeg: 'server-error.jpg' },
  { id: 'forbidden', file: 'forbidden.png', slug: 'forbidden', jpeg: 'forbidden.jpg' },
];

function colorDistanceRgb(r, g, b) {
  return Math.sqrt((r - MATTE_BG.r) ** 2 + (g - MATTE_BG.g) ** 2 + (b - MATTE_BG.b) ** 2);
}

function isFloodBackdropPixel(r, g, b, alpha) {
  if (alpha < 16) {
    return true;
  }
  return colorDistanceRgb(r, g, b) <= 38;
}

function buildEdgeBandMask(alphaChannel, width, height) {
  const count = width * height;
  const band = new Uint8Array(count);
  const queue = [];

  for (let i = 0; i < count; i += 1) {
    const a = alphaChannel[i];
    if (a > 0 && a < 255) {
      band[i] = 1;
      queue.push(i);
    }
  }

  let head = 0;
  const maxSteps = EDGE_BAND_PX;
  const steps = new Int8Array(count);
  for (let i = 0; i < count; i += 1) {
    if (band[i] === 1) {
      steps[i] = 0;
    } else {
      steps[i] = -1;
    }
  }

  while (head < queue.length) {
    const index = queue[head];
    head += 1;
    const step = steps[index];
    if (step >= maxSteps) {
      continue;
    }
    const x = index % width;
    const y = Math.floor(index / width);
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        continue;
      }
      const next = ny * width + nx;
      if (alphaChannel[next] === 0 || steps[next] !== -1) {
        continue;
      }
      steps[next] = step + 1;
      band[next] = 1;
      queue.push(next);
    }
  }

  return band;
}

function floodClearBorderBackdrop(pixels, width, height) {
  const count = width * height;
  const visited = new Uint8Array(count);
  const queue = [];

  const trySeed = (x, y) => {
    const index = y * width + x;
    if (visited[index] !== 0) {
      return;
    }
    const offset = index * 4;
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];
    const alpha = pixels[offset + 3];
    if (isFloodBackdropPixel(r, g, b, alpha)) {
      visited[index] = 1;
      queue.push(index);
    }
  };

  for (let x = 0; x < width; x += 1) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const index = queue[head];
    head += 1;
    pixels[index * 4 + 3] = 0;

    const x = index % width;
    const y = Math.floor(index / width);
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        continue;
      }
      const next = ny * width + nx;
      if (visited[next] !== 0) {
        continue;
      }
      const offset = next * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      const alpha = pixels[offset + 3];
      if (isFloodBackdropPixel(r, g, b, alpha)) {
        visited[next] = 1;
        queue.push(next);
      }
    }
  }
}

function defringeEdgeBandOnly(pixels, width, height) {
  const count = width * height;
  const originalAlpha = new Uint8Array(count);
  for (let i = 0; i < count; i += 1) {
    originalAlpha[i] = pixels[i * 4 + 3];
  }
  const band = buildEdgeBandMask(originalAlpha, width, height);

  for (let i = 0; i < count; i += 1) {
    if (band[i] === 0) {
      continue;
    }
    const offset = i * 4;
    const alphaByte = pixels[offset + 3];
    if (alphaByte === 0 || alphaByte === 255) {
      continue;
    }
    const alpha = alphaByte / 255;
    pixels[offset] = Math.min(
      255,
      Math.max(0, Math.round((pixels[offset] - (1 - alpha) * MATTE_BG.r) / alpha))
    );
    pixels[offset + 1] = Math.min(
      255,
      Math.max(0, Math.round((pixels[offset + 1] - (1 - alpha) * MATTE_BG.g) / alpha))
    );
    pixels[offset + 2] = Math.min(
      255,
      Math.max(0, Math.round((pixels[offset + 2] - (1 - alpha) * MATTE_BG.b) / alpha))
    );
  }

  featherEdgeAlpha(pixels, width, height, band, originalAlpha);
}

function featherEdgeAlpha(pixels, width, height, band, originalAlpha) {
  const count = width * height;
  const alpha = new Uint8Array(count);
  for (let i = 0; i < count; i += 1) {
    alpha[i] = originalAlpha[i];
  }

  const eroded = new Uint8Array(count);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (band[index] === 0) {
        eroded[index] = alpha[index];
        continue;
      }
      let min = 255;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = Math.min(width - 1, Math.max(0, x + dx));
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          min = Math.min(min, alpha[ny * width + nx]);
        }
      }
      eroded[index] = min;
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (band[index] === 0) {
        pixels[index * 4 + 3] = originalAlpha[index];
        continue;
      }
      let sum = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = Math.min(width - 1, Math.max(0, x + dx));
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          sum += eroded[ny * width + nx];
        }
      }
      pixels[index * 4 + 3] = Math.round(sum / 9);
    }
  }
}

function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function rgbToLab(r, g, b) {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  const x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
  const z = rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041;
  const refX = 0.95047;
  const refY = 1;
  const refZ = 1.08883;
  const f = (t) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116);
  const fx = f(x / refX);
  const fy = f(y / refY);
  const fz = f(z / refZ);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function deltaE76(rgbA, rgbB) {
  const labA = rgbToLab(rgbA.r, rgbA.g, rgbA.b);
  const labB = rgbToLab(rgbB.r, rgbB.g, rgbB.b);
  return Math.sqrt((labA.l - labB.l) ** 2 + (labA.a - labB.a) ** 2 + (labA.b - labB.b) ** 2);
}

function findVermilionStrokeSamples(rgba, width, height, maxSamples) {
  const samples = [];
  for (let y = Math.floor(height * 0.35); y < Math.floor(height * 0.72); y += 2) {
    for (let x = Math.floor(width * 0.2); x < Math.floor(width * 0.8); x += 2) {
      const offset = (y * width + x) * 4;
      const r = rgba[offset];
      const g = rgba[offset + 1];
      const b = rgba[offset + 2];
      const a = rgba[offset + 3];
      if (a < 200) {
        continue;
      }
      if (r > 185 && g < 115 && b < 95 && r - g > 70 && r - b > 55) {
        samples.push({ x, y, rgb: { r, g, b } });
      }
    }
  }
  samples.sort((left, right) => right.rgb.r - left.rgb.g - (left.rgb.r - left.rgb.g));
  return samples.slice(0, maxSamples);
}

async function verifyStrokeColors(scene) {
  const referencePath = path.join(sourceDir, scene.file);
  const webpPath = path.join(outDir, scene.slug, `${scene.slug}-1440.webp`);
  const { data: srcData, info: srcInfo } = await sharp(referencePath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const samples = findVermilionStrokeSamples(srcData, srcInfo.width, srcInfo.height, 12);
  if (samples.length < 4) {
    console.warn(`Skipping stroke ΔE check for ${scene.file}: only ${String(samples.length)} samples`);
    return { samples, worst: 0 };
  }

  const { data: outData, info: outInfo } = await sharp(webpPath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  let worst = 0;
  let checked = 0;
  const searchRadius = 6;
  for (const sample of samples) {
    const ox = Math.round((sample.x / srcInfo.width) * outInfo.width);
    const oy = Math.round((sample.y / srcInfo.height) * outInfo.height);
    let bestDE = Infinity;
    let bestRgb = { r: 0, g: 0, b: 0 };
    for (let dy = -searchRadius; dy <= searchRadius; dy += 1) {
      for (let dx = -searchRadius; dx <= searchRadius; dx += 1) {
        const px = ox + dx;
        const py = oy + dy;
        if (px < 0 || py < 0 || px >= outInfo.width || py >= outInfo.height) {
          continue;
        }
        const offset = (py * outInfo.width + px) * 4;
        const outA = outData[offset + 3];
        if (outA < 200) {
          continue;
        }
        const candidate = {
          r: outData[offset],
          g: outData[offset + 1],
          b: outData[offset + 2],
        };
        const dE = deltaE76(sample.rgb, candidate);
        if (dE < bestDE) {
          bestDE = dE;
          bestRgb = candidate;
        }
      }
    }
    if (bestDE === Infinity) {
      continue;
    }
    worst = Math.max(worst, bestDE);
    checked += 1;
    if (bestDE > MAX_STROKE_DELTA_E) {
      throw new Error(
        `${scene.slug} stroke colour drift ΔE=${bestDE.toFixed(2)} near (${String(ox)},${String(oy)}) ` +
          `src rgb(${String(sample.rgb.r)},${String(sample.rgb.g)},${String(sample.rgb.b)}) ` +
          `out rgb(${String(bestRgb.r)},${String(bestRgb.g)},${String(bestRgb.b)})`
      );
    }
  }
  if (checked < 3) {
    throw new Error(`Too few opaque stroke samples matched in built ${scene.slug} asset`);
  }
  return { samples, outInfo, worst };
}

async function verifyStrokeColorsAgainstJpeg(scene) {
  const jpegPath = path.join(sourceDir, scene.jpeg);
  const webpPath = path.join(outDir, scene.slug, `${scene.slug}-1440.webp`);
  const { data: srcData, info: srcInfo } = await sharp(jpegPath).removeAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const samples = findVermilionStrokeSamples(srcData, srcInfo.width, srcInfo.height, 8);
  if (samples.length < 3) {
    return;
  }
  const { data: outData, info: outInfo } = await sharp(webpPath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const searchRadius = 8;
  for (const sample of samples) {
    const ox = Math.round((sample.x / srcInfo.width) * outInfo.width);
    const oy = Math.round((sample.y / srcInfo.height) * outInfo.height);
    let bestDE = Infinity;
    for (let dy = -searchRadius; dy <= searchRadius; dy += 1) {
      for (let dx = -searchRadius; dx <= searchRadius; dx += 1) {
        const px = ox + dx;
        const py = oy + dy;
        if (px < 0 || py < 0 || px >= outInfo.width || py >= outInfo.height) {
          continue;
        }
        const offset = (py * outInfo.width + px) * 4;
        if (outData[offset + 3] < 200) {
          continue;
        }
        const candidate = { r: outData[offset], g: outData[offset + 1], b: outData[offset + 2] };
        bestDE = Math.min(bestDE, deltaE76(sample.rgb, candidate));
      }
    }
    if (bestDE !== Infinity && bestDE > MAX_STROKE_DELTA_E_JPEG) {
      throw new Error(
        `${scene.slug} JPEG stroke drift ΔE=${bestDE.toFixed(2)} (limit ${String(MAX_STROKE_DELTA_E_JPEG)})`
      );
    }
  }
}

async function polishedCutoutPipeline(sourcePath) {
  const { data, info } = await sharp(sourcePath)
    .toColorspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = new Uint8Array(data);
  floodClearBorderBackdrop(pixels, info.width, info.height);
  defringeEdgeBandOnly(pixels, info.width, info.height);
  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).toColorspace('srgb');
}

async function encodeVariant(pipeline, outPath, format) {
  const base = pipeline.clone().toColorspace('srgb').ensureAlpha();
  if (format === 'webp') {
    await base
      .webp({ quality: 72, alphaQuality: 100, effort: 6, smartSubsample: false })
      .toFile(outPath);
    return;
  }
  await base.avif({ quality: 48, effort: 6, chromaSubsampling: '4:4:4' }).toFile(outPath);
}

async function buildScene(scene) {
  const sourcePath = path.join(sourceDir, scene.file);
  const polished = await polishedCutoutPipeline(sourcePath);
  const meta = await polished.metadata();
  if (meta.width == null || meta.height == null) {
    throw new Error(`Missing dimensions for ${scene.file}`);
  }
  const aspect = meta.height / meta.width;
  const sceneDir = path.join(outDir, scene.slug);
  await mkdir(sceneDir, { recursive: true });

  const entry = {
    id: scene.id,
    slug: scene.slug,
    width: meta.width,
    height: meta.height,
  };

  const polishedBuffer = await polished.png().toBuffer();

  for (const width of WIDTHS) {
    const height = Math.round(width * aspect);
    const pipeline = sharp(polishedBuffer)
      .toColorspace('srgb')
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: false,
      });
    const webpPath = path.join(sceneDir, `${scene.slug}-${width}.webp`);
    const avifPath = path.join(sceneDir, `${scene.slug}-${width}.avif`);
    await encodeVariant(pipeline, webpPath, 'webp');
    await encodeVariant(pipeline, avifPath, 'avif');
  }

  await verifyStrokeColors(scene);
  if (scene.slug !== 'mascot-base') {
    await verifyStrokeColorsAgainstJpeg(scene);
  }

  return entry;
}

function renderManifest(entries) {
  const lines = [
    '// SPDX-FileCopyrightText: 2026 Thomas Faust',
    '// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0',
    '// Generated by scripts/build-error-scene-images.mjs — do not edit.',
    '',
    'export type ErrorSceneId =',
    "  | 'offline'",
    "  | 'unreachable'",
    "  | 'serverFault'",
    "  | 'notFound'",
    "  | 'unexpected'",
    "  | 'forbidden';",
    '',
    'export interface ErrorSceneManifestEntry {',
    '  id: ErrorSceneId;',
    '  slug: string;',
    '  width: number;',
    '  height: number;',
    '}',
    '',
    'export const ERROR_SCENE_WIDTHS: readonly number[] = [480, 960, 1440];',
    '',
    'export const ERROR_SCENE_MANIFEST: Record<ErrorSceneId, ErrorSceneManifestEntry> = {',
  ];

  for (const entry of entries) {
    lines.push(
      `  ${entry.id}: { id: '${entry.id}', slug: '${entry.slug}', width: ${entry.width}, height: ${entry.height} },`
    );
  }
  lines.push('};', '');
  return lines.join('\n');
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const entries = [];
  for (const scene of SCENES) {
    entries.push(await buildScene(scene));
  }
  await writeFile(manifestPath, renderManifest(entries), 'utf8');

  for (const scene of SCENES) {
    const sceneDir = path.join(outDir, scene.slug);
    const files = await readdir(sceneDir);
    for (const file of files) {
      if (file.includes('-dark.')) {
        await rm(path.join(sceneDir, file));
      }
    }
  }

  const { execSync } = await import('node:child_process');
  const du = execSync(`du -sb ${outDir}`, { encoding: 'utf8' }).trim().split('\t')[0];
  const bytes = Number(du);
  if (bytes > 1_600_000) {
    console.warn(`warning: error-scenes assets are ${bytes} bytes (> 1.5 MB target)`);
  }
  console.log(`Built error scene assets (${bytes} bytes) -> ${outDir}`);
}

await main();
