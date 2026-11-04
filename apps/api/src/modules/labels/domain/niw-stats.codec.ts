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
