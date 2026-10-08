import { describe, expect, it } from 'vitest';
import { MIN_VECTORS_FOR_UMAP, projectLabelMap2D } from './label-map-projection.js';

describe('projectLabelMap2D', () => {
  it('uses PCA for small sets', () => {
    const vectors = [
      [0, 0],
      [1, 0],
      [0, 1],
    ];
    const result = projectLabelMap2D(vectors);
    expect(result.method).toBe('pca');
    expect(result.coords).toHaveLength(3);
  });

  it('uses UMAP when enough vectors', () => {
    const vectors = Array.from({ length: MIN_VECTORS_FOR_UMAP }, (_, i) => [
      Math.sin(i * 0.7),
      Math.cos(i * 0.31),
    ]);
    const result = projectLabelMap2D(vectors);
    expect(['umap', 'pca']).toContain(result.method);
    expect(result.coords).toHaveLength(MIN_VECTORS_FOR_UMAP);
  });
});
