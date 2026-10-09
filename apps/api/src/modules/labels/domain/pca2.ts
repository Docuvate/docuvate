// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i]! * b[i]!;
  }
  return s;
}

function norm(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

function scale(v: number[], factor: number): number[] {
  return v.map((x) => x * factor);
}

function add(a: number[], b: number[]): number[] {
  return a.map((x, i) => x + b[i]!);
}

function subtract(a: number[], b: number[]): number[] {
  return a.map((x, i) => x - b[i]!);
}

function matVecMul(rows: number[][], v: number[]): number[] {
  return rows.map((row) => dot(row, v));
}

function projectToPrincipalComponents(vectors: number[][], componentCount: number): number[][] {
  const n = vectors.length;
  if (n === 0) {
    return [];
  }
  const d = vectors[0]?.length ?? 0;
  if (d === 0) {
    return vectors.map(() => new Array<number>(componentCount).fill(0));
  }

  const mean = new Array<number>(d).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < d; i++) {
      mean[i]! += v[i]!;
    }
  }
  for (let i = 0; i < d; i++) {
    mean[i]! /= n;
  }

  const centered = vectors.map((v) => subtract(v, mean));

  function powerComponent(rows: number[][], exclude: number[][]): number[] {
    let comp = new Array<number>(d).fill(0);
    comp[0] = 1;
    let len = norm(comp);
    if (len > 0) {
      comp = scale(comp, 1 / len);
    }

    for (let iter = 0; iter < 48; iter++) {
      const dual = matVecMul(rows, comp);
      let next = new Array<number>(d).fill(0);
      for (let i = 0; i < n; i++) {
        const row = rows[i]!;
        const w = dual[i]!;
        next = add(next, scale(row, w));
      }
      for (const ex of exclude) {
        const proj = dot(next, ex);
        next = subtract(next, scale(ex, proj));
      }
      len = norm(next);
      if (len < 1e-12) {
        break;
      }
      comp = scale(next, 1 / len);
    }
    return comp;
  }

  const components: number[][] = [];
  for (let k = 0; k < componentCount; k++) {
    components.push(powerComponent(centered, components));
  }

  return centered.map((row) => components.map((comp) => dot(row, comp)));
}

/** Top-two PCA components via power iteration on centered rows (CPU-friendly, no deps). */
export function projectTo2D(vectors: number[][]): [number, number][] {
  return projectToPrincipalComponents(vectors, 2).map(
    (coords) => [coords[0] ?? 0, coords[1] ?? 0] as [number, number]
  );
}

function normalizeAxis(values: number[], pad: number): number[] {
  if (values.length === 0) {
    return [];
  }
  let min = values[0]!;
  let max = values[0]!;
  for (const v of values) {
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  const span = max - min || 1;
  return values.map((v) => pad + ((v - min) / span) * (1 - 2 * pad));
}

/** Normalize 2D coords into ~0..1 for display (with padding). */
export function normalizePlotCoords(coords: [number, number][]): [number, number][] {
  if (coords.length === 0) {
    return [];
  }
  const xs = coords.map(([x]) => x);
  const ys = coords.map(([, y]) => y);
  const pad = 0.08;
  const nx = normalizeAxis(xs, pad);
  const ny = normalizeAxis(ys, pad);
  return nx.map((x, i) => [x, ny[i]!] as [number, number]);
}
