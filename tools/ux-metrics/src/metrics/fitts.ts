import type { Box, FittsSegment } from './types.js';

/** Shannon formulation (MacKenzie, 1992): ID = log2(D/W + 1). */
export function indexOfDifficulty(distance: number, effectiveWidth: number): number {
  if (!Number.isFinite(distance) || distance < 0) {
    throw new Error('distance must be a non-negative finite number');
  }
  if (!Number.isFinite(effectiveWidth) || effectiveWidth <= 0) {
    throw new Error('effectiveWidth must be a positive finite number');
  }
  return Math.log2(distance / effectiveWidth + 1);
}

export function boxCenter(box: Box): { x: number; y: number } {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Target width parallel to the movement axis (ISO-style projection). */
export function effectiveWidthAlongMovement(from: Box, to: Box): number {
  const a = boxCenter(from);
  const b = boxCenter(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const angle = Math.atan2(dy, dx);
  const w = to.width;
  const h = to.height;
  return Math.max(1, Math.abs(w * Math.cos(angle)) + Math.abs(h * Math.sin(angle)));
}

export function movementDistance(from: Box, to: Box): number {
  const a = boxCenter(from);
  const b = boxCenter(to);
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Literature constants for 2D pointing (MacKenzie, 1992, table 1; ms). */
export const FITTS_LITERATURE = {
  interceptMs: 50,
  slopeMsPerBit: 150,
  citation:
    'MacKenzie, I. S. (1992). Fitts\' law as a research and design tool in human-computer interaction. Human-Computer Interaction, 7(1), 91–139.',
} as const;

export function predictedMovementTimeMs(indexOfDifficultyBits: number): number {
  return FITTS_LITERATURE.interceptMs + FITTS_LITERATURE.slopeMsPerBit * indexOfDifficultyBits;
}

export function fittsSegment(
  from: Box,
  to: Box,
  fromHint = 'pointer',
  toHint = 'target'
): FittsSegment {
  const distance = movementDistance(from, to);
  const effectiveWidth = effectiveWidthAlongMovement(from, to);
  const id = indexOfDifficulty(distance, effectiveWidth);
  return {
    from,
    to,
    fromHint,
    toHint,
    distance,
    effectiveWidth,
    indexOfDifficulty: id,
    predictedMovementTimeMs: predictedMovementTimeMs(id),
  };
}

export function sumFittsSegments(segments: FittsSegment[]): {
  sumIndexOfDifficulty: number;
  sumPredictedMovementTimeMs: number;
} {
  let sumIndexOfDifficulty = 0;
  let sumPredictedMovementTimeMs = 0;
  for (const s of segments) {
    sumIndexOfDifficulty += s.indexOfDifficulty;
    sumPredictedMovementTimeMs += s.predictedMovementTimeMs;
  }
  return { sumIndexOfDifficulty, sumPredictedMovementTimeMs };
}
