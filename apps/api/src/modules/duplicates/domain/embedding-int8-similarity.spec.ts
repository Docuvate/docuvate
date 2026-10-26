// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { int8EmbeddingDot } from './embedding-int8-similarity.js';

function quantize(vector: number[]): { scale: number; bytes: Buffer; floats: number[] } {
  let peak = 0;
  for (const value of vector) {
    const abs = Math.abs(value);
    if (abs > peak) peak = abs;
  }
  const scale = peak > 0 ? peak / 127 : 1;
  const bytes = Buffer.alloc(vector.length);
  const floats: number[] = [];
  for (let i = 0; i < vector.length; i += 1) {
    const quantized = Math.round(vector[i] / scale);
    const clamped = Math.max(-127, Math.min(127, quantized));
    bytes.writeInt8(clamped, i);
    floats.push(clamped * scale);
  }
  return { scale, bytes, floats };
}

describe('int8EmbeddingDot', () => {
  it('matches cosine similarity on quantized document-mean vectors', () => {
    const a = quantize([0.12, -0.44, 0.91, 0.03, -0.18, 0.55]);
    const b = quantize([0.11, -0.42, 0.89, 0.05, -0.2, 0.51]);
    const int8Sim = int8EmbeddingDot(a.scale, a.bytes, b.scale, b.bytes);
    const floatDot = a.floats.reduce((sum, value, index) => sum + value * b.floats[index], 0);
    expect(Math.abs(int8Sim - floatDot)).toBeLessThan(0.002);
  });
});
