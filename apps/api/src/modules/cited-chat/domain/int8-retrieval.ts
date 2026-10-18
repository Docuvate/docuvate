// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export function hammingDistance(a: Buffer, b: Buffer): number {
  const len = Math.min(a.length, b.length);
  let distance = 0;
  for (let i = 0; i < len; i += 1) {
    let x = a[i] ^ b[i];
    while (x > 0) {
      distance += x & 1;
      x >>= 1;
    }
  }
  return distance;
}

export function int8Dot(scaleA: number, bytesA: Buffer, scaleB: number, bytesB: Buffer): number {
  const len = Math.min(bytesA.length, bytesB.length);
  let sum = 0;
  for (let i = 0; i < len; i += 1) {
    sum += bytesA.readInt8(i) * bytesB.readInt8(i);
  }
  return scaleA * scaleB * sum;
}

export function quantizeQueryVector(vector: number[]): { scale: number; bytes: Buffer } {
  let peak = 0;
  for (const value of vector) {
    const abs = Math.abs(value);
    if (abs > peak) {
      peak = abs;
    }
  }
  const scale = peak > 0 ? peak / 127 : 1;
  const bytes = Buffer.alloc(vector.length);
  for (let i = 0; i < vector.length; i += 1) {
    const quantized = Math.round(vector[i] / scale);
    const clamped = Math.max(-127, Math.min(127, quantized));
    bytes.writeInt8(clamped, i);
  }
  return { scale, bytes };
}
