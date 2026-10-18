// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type SequenceOpcodeTag = 'equal' | 'replace' | 'delete' | 'insert';

export interface SequenceOpcode {
  tag: SequenceOpcodeTag;
  i1: number;
  i2: number;
  j1: number;
  j2: number;
}

const MAX_ALIGN_TOKENS = 700;

function truncateForAlignment<T>(tokens: T[]): T[] {
  if (tokens.length <= MAX_ALIGN_TOKENS) return tokens;
  const head = Math.floor(MAX_ALIGN_TOKENS * 0.6);
  const tail = MAX_ALIGN_TOKENS - head;
  return [...tokens.slice(0, head), ...tokens.slice(tokens.length - tail)];
}

/**
 * Ratcliff/Obershelp-style opcodes on token sequences (difflib-compatible semantics).
 */
export function longestCommonSubsequenceLength<T>(
  a: T[],
  b: T[],
  equals: (left: T, right: T) => boolean
): number {
  const left = truncateForAlignment(a);
  const right = truncateForAlignment(b);
  const n = left.length;
  const m = right.length;
  const prev = new Array<number>(m + 1).fill(0);
  const curr = new Array<number>(m + 1).fill(0);
  for (let i = 1; i <= n; i += 1) {
    for (let j = 0; j <= m; j += 1) curr[j] = 0;
    for (let j = 1; j <= m; j += 1) {
      if (equals(left[i - 1], right[j - 1])) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    for (let j = 0; j <= m; j += 1) prev[j] = curr[j];
  }
  return prev[m];
}

export function sequenceOpcodes<T>(
  a: T[],
  b: T[],
  equals: (left: T, right: T) => boolean
): SequenceOpcode[] {
  const left = truncateForAlignment(a);
  const right = truncateForAlignment(b);
  const n = left.length;
  const m = right.length;
  if (n === 0 && m === 0) return [];
  if (n === 0) return [{ tag: 'insert', i1: 0, i2: 0, j1: 0, j2: m }];
  if (m === 0) return [{ tag: 'delete', i1: 0, i2: n, j1: 0, j2: 0 }];

  const lcs = buildLcsTable(left, right, equals);
  const opcodes: SequenceOpcode[] = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && equals(left[i], right[j])) {
      const startI = i;
      const startJ = j;
      while (i < n && j < m && equals(left[i], right[j])) {
        i += 1;
        j += 1;
      }
      opcodes.push({ tag: 'equal', i1: startI, i2: i, j1: startJ, j2: j });
      continue;
    }
    const down = i < n ? lcs[i + 1][j] : -1;
    const rightStep = j < m ? lcs[i][j + 1] : -1;
    if (down >= rightStep) {
      const startI = i;
      i += 1;
      while (i < n && j < m && !equals(left[i], right[j]) && lcs[i + 1][j] >= lcs[i][j + 1]) {
        i += 1;
      }
      opcodes.push({ tag: 'delete', i1: startI, i2: i, j1: j, j2: j });
    } else {
      const startJ = j;
      j += 1;
      while (i < n && j < m && !equals(left[i], right[j]) && lcs[i][j + 1] > lcs[i + 1][j]) {
        j += 1;
      }
      opcodes.push({ tag: 'insert', i1: i, i2: i, j1: startJ, j2: j });
    }
  }
  return mergeReplaceOpcodes(opcodes);
}

function buildLcsTable<T>(
  a: T[],
  b: T[],
  equals: (left: T, right: T) => boolean
): number[][] {
  const n = a.length;
  const m = b.length;
  const table: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      if (equals(a[i], b[j])) {
        table[i][j] = table[i + 1][j + 1] + 1;
      } else {
        table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
  }
  return table;
}

function mergeReplaceOpcodes(opcodes: SequenceOpcode[]): SequenceOpcode[] {
  const merged: SequenceOpcode[] = [];
  for (const op of opcodes) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      prev.tag === 'delete' &&
      op.tag === 'insert' &&
      prev.i2 === op.i1 &&
      prev.j2 === op.j1
    ) {
      merged[merged.length - 1] = {
        tag: 'replace',
        i1: prev.i1,
        i2: op.i2,
        j1: prev.j1,
        j2: op.j2,
      };
    } else {
      merged.push(op);
    }
  }
  return merged;
}
