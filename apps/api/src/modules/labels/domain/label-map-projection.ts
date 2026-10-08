import { UMAP } from 'umap-js';
import { normalizePlotCoords, projectTo2D } from './pca2.js';

export type LabelMapProjectionMethod = 'pca' | 'umap';

/** Below this count, UMAP is unstable — use linear PCA. */
export const MIN_VECTORS_FOR_UMAP = 15;

export function projectLabelMap2D(vectors: number[][]): {
  coords: [number, number][];
  method: LabelMapProjectionMethod;
} {
  if (vectors.length === 0) {
    return { coords: [], method: 'pca' };
  }

  if (vectors.length < MIN_VECTORS_FOR_UMAP) {
    return {
      coords: normalizePlotCoords(projectTo2D(vectors)),
      method: 'pca',
    };
  }

  const nNeighbors = Math.min(15, Math.max(2, vectors.length - 1));
  try {
    const umap = new UMAP({
      nComponents: 2,
      nNeighbors,
      minDist: 0.12,
    });
    const raw = umap.fit(vectors) as number[][];
    const coords = raw.map((row) => [row[0] ?? 0, row[1] ?? 0] as [number, number]);
    return {
      coords: normalizePlotCoords(coords),
      method: 'umap',
    };
  } catch {
    return {
      coords: normalizePlotCoords(projectTo2D(vectors)),
      method: 'pca',
    };
  }
}
