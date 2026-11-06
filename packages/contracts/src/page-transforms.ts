// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Clockwise quarter turns relative to the source page MediaBox (0..3). */
export type PageRotationQuarterTurns = 0 | 1 | 2 | 3;

export type PageTransformSource = 'user' | 'pipeline';

export interface DocumentPageTransformDto {
  page: number;
  rotationQuarterTurns: PageRotationQuarterTurns;
  deskewDeg: number;
  source: PageTransformSource;
  updatedAt: string;
}

export interface DocumentPageTransformsResponse {
  transforms: DocumentPageTransformDto[];
}

export interface ApplyPageTransformRequest {
  /** Idempotency id for the correction row. */
  id: string;
  rotationQuarterTurns: PageRotationQuarterTurns;
  /** Optional small deskew; defaults to 0. */
  deskewDeg?: number;
}

export interface ApplyPageTransformResponse {
  transform: DocumentPageTransformDto;
  correctionId: string;
}

export function quarterTurnsToDegrees(turns: PageRotationQuarterTurns): 0 | 90 | 180 | 270 {
  if (turns === 1) return 90;
  if (turns === 2) return 180;
  if (turns === 3) return 270;
  return 0;
}

export function degreesToQuarterTurns(deg: number): PageRotationQuarterTurns {
  const turns = ((Math.round(deg / 90) % 4) + 4) % 4;
  if (turns === 1 || turns === 2 || turns === 3) {
    return turns;
  }
  return 0;
}
