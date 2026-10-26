// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Dot product of two int8-quantized vectors (same math as document_mean_int8 storage). */
export function int8EmbeddingDot(
  scaleA: number,
  bytesA: Buffer,
  scaleB: number,
  bytesB: Buffer
): number {
  const len = Math.min(bytesA.length, bytesB.length);
  let sum = 0;
  for (let i = 0; i < len; i += 1) {
    sum += bytesA.readInt8(i) * bytesB.readInt8(i);
  }
  return scaleA * scaleB * sum;
}
