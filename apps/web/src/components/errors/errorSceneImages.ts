// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { ErrorSceneId } from './errorSceneManifest.generated';
import { ERROR_SCENE_MANIFEST, ERROR_SCENE_WIDTHS } from './errorSceneManifest.generated';

export function buildErrorSceneSrcSet(scene: ErrorSceneId, format: 'avif' | 'webp'): string {
  const { slug } = ERROR_SCENE_MANIFEST[scene];
  const extension = format === 'avif' ? 'avif' : 'webp';
  return ERROR_SCENE_WIDTHS
    .map((width) => `/error-scenes/${slug}/${slug}-${String(width)}.${extension} ${String(width)}w`)
    .join(', ');
}

export function errorSceneFallbackSrc(scene: ErrorSceneId): string {
  const { slug } = ERROR_SCENE_MANIFEST[scene];
  const width = ERROR_SCENE_WIDTHS[1] ?? 960;
  return `/error-scenes/${slug}/${slug}-${String(width)}.webp`;
}
