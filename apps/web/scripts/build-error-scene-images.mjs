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
/** Cream backdrop from source art; used only to defringe semi-transparent edge pixels. */
const MATTE_BG = { r: 245, g: 241, b: 233 };

const SCENES = [
  { id: 'unexpected', file: 'mascot-base.png', slug: 'mascot-base' },
  { id: 'unreachable', file: 'unreachable.png', slug: 'unreachable' },
  { id: 'offline', file: 'offline.png', slug: 'offline' },
  { id: 'notFound', file: 'not-found.png', slug: 'not-found' },
  { id: 'serverFault', file: 'server-error.png', slug: 'server-error' },
  { id: 'forbidden', file: 'forbidden.png', slug: 'forbidden' },
];

function colorDistanceRgb(r, g, b) {
  return Math.sqrt((r - MATTE_BG.r) ** 2 + (g - MATTE_BG.g) ** 2 + (b - MATTE_BG.b) ** 2);
}

function isBackdropPixel(r, g, b, alpha) {
  if (alpha < 12) {
    return true;
  }
  if (colorDistanceRgb(r, g, b) <= 44) {
    return true;
  }
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  return saturation < 0.09 && max < 245 && max > 55;
}

/** Remove backdrop remnants still connected to the image border (floor, shadow planes). */
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
    if (isBackdropPixel(r, g, b, alpha)) {
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
    const x = index % width;
    const y = Math.floor(index / width);
    pixels[index * 4 + 3] = 0;

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
      if (isBackdropPixel(r, g, b, alpha)) {
        visited[next] = 1;
        queue.push(next);
      }
    }
  }
}

function pruneLightFringe(pixels, width, height) {
  const count = width * height;
  for (let i = 0; i < count; i += 1) {
    const offset = i * 4;
    const alpha = pixels[offset + 3];
    if (alpha === 0 || alpha === 255) {
      continue;
    }
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luminance > 205 && colorDistanceRgb(r, g, b) < 58) {
      pixels[offset + 3] = Math.max(0, Math.round(alpha * 0.25));
    }
  }
}

function defringeAndFeatherAlpha(pixels, width, height) {
  const count = width * height;
  for (let i = 0; i < count; i += 1) {
    const offset = i * 4;
    const alphaByte = pixels[offset + 3];
    const alpha = alphaByte / 255;
    if (alpha <= 0.02) {
      continue;
    }
    const spill = Math.max(0, pixels[offset] - Math.max(pixels[offset + 1], pixels[offset + 2]));
    if (spill > 0 && alpha < 1) {
      pixels[offset] = Math.max(0, pixels[offset] - Math.round(spill * 0.85));
    }
    if (alpha >= 0.98) {
      continue;
    }
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

  const alpha = new Uint8Array(count);
  for (let i = 0; i < count; i += 1) {
    alpha[i] = pixels[i * 4 + 3];
  }

  const eroded = new Uint8Array(count);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let min = 255;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = Math.min(width - 1, Math.max(0, x + dx));
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          min = Math.min(min, alpha[ny * width + nx]);
        }
      }
      eroded[y * width + x] = min;
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = Math.min(width - 1, Math.max(0, x + dx));
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          sum += eroded[ny * width + nx];
        }
      }
      pixels[(y * width + x) * 4 + 3] = Math.round(sum / 9);
    }
  }
}

async function polishedCutoutPipeline(sourcePath) {
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8Array(data);
  floodClearBorderBackdrop(pixels, info.width, info.height);
  defringeAndFeatherAlpha(pixels, info.width, info.height);
  pruneLightFringe(pixels, info.width, info.height);
  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

async function encodeVariant(pipeline, outPath, format) {
  if (format === 'webp') {
    await pipeline
      .clone()
      .webp({ quality: 68, alphaQuality: 88, effort: 6 })
      .toFile(outPath);
    return;
  }
  await pipeline.clone().avif({ quality: 42, effort: 6 }).toFile(outPath);
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
    const pipeline = sharp(polishedBuffer).resize(width, height, {
      fit: 'inside',
      withoutEnlargement: false,
    });
    const webpPath = path.join(sceneDir, `${scene.slug}-${width}.webp`);
    const avifPath = path.join(sceneDir, `${scene.slug}-${width}.avif`);
    await encodeVariant(pipeline, webpPath, 'webp');
    await encodeVariant(pipeline, avifPath, 'avif');
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
