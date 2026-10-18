// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Float32 bytea encoding for NIW sufficient statistics (~4 bytes per dim + 4 per dim²). */

export function encodeSumXF32(values: number[]): Buffer {
  const buf = Buffer.alloc(values.length * 4);
  for (let i = 0; i < values.length; i++) {
    buf.writeFloatLE(values[i] ?? 0, i * 4);
  }
  return buf;
}

export function encodeSumXxF32(matrix: number[][]): Buffer {
  const dim = matrix.length;
  const buf = Buffer.alloc(dim * dim * 4);
  let offset = 0;
  for (let i = 0; i < dim; i++) {
    const row = matrix[i] ?? [];
    for (let j = 0; j < dim; j++) {
      buf.writeFloatLE(row[j] ?? 0, offset);
      offset += 4;
    }
  }
  return buf;
}

export function decodeSumXF32(buffer: Buffer): number[] {
  const count = buffer.byteLength / 4;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push(buffer.readFloatLE(i * 4));
  }
  return out;
}

export function decodeSumXxF32(buffer: Buffer, dim: number): number[][] {
  const expected = dim * dim * 4;
  if (buffer.byteLength !== expected) {
    throw new Error('sum_xx_f32 byte length mismatch');
  }
  const matrix: number[][] = [];
  let offset = 0;
  for (let i = 0; i < dim; i++) {
    const row: number[] = [];
    for (let j = 0; j < dim; j++) {
      row.push(buffer.readFloatLE(offset));
      offset += 4;
    }
    matrix.push(row);
  }
  return matrix;
}

export function bytesPerLabel(dim: number): number {
  return 4 * dim + 4 * dim * dim;
}
