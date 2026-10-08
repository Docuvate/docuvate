import { describe, expect, it } from 'vitest';
import {
  effectiveWidthAlongMovement,
  fittsSegment,
  indexOfDifficulty,
  movementDistance,
  predictedMovementTimeMs,
} from './fitts.js';

describe('indexOfDifficulty', () => {
  it('matches Shannon formulation for known values', () => {
    expect(indexOfDifficulty(100, 10)).toBeCloseTo(Math.log2(11), 8);
    expect(indexOfDifficulty(0, 24)).toBe(0);
  });

  it('rejects invalid width', () => {
    expect(() => indexOfDifficulty(10, 0)).toThrow();
  });
});

describe('fittsSegment', () => {
  it('computes distance between box centers', () => {
    const from = { x: 0, y: 0, width: 40, height: 40 };
    const to = { x: 100, y: 0, width: 40, height: 40 };
    expect(movementDistance(from, to)).toBe(100);
    expect(effectiveWidthAlongMovement(from, to)).toBe(40);
    const seg = fittsSegment(from, to);
    expect(seg.indexOfDifficulty).toBeCloseTo(Math.log2(100 / 40 + 1), 8);
    expect(seg.predictedMovementTimeMs).toBe(
      predictedMovementTimeMs(seg.indexOfDifficulty)
    );
  });
});
