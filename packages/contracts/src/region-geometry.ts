// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Axis-aligned box in unrotated page space, origin top-left, range 0…1. */
export interface NormalizedRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Word-level IR token used for region resolution. */
export interface LayoutToken {
  blockIndex: number;
  page: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text: string;
}

export const TOKEN_COVERAGE_THRESHOLD = 0.5;
export const GEOMETRY_HASH_DECIMALS = 4;

function finiteNumber(value: number): boolean {
  return Number.isFinite(value);
}

export function clampUnit(value: number): number {
  if (!finiteNumber(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function normalizeRect(rect: NormalizedRect): NormalizedRect | null {
  const x0 = clampUnit(Math.min(rect.x0, rect.x1));
  const x1 = clampUnit(Math.max(rect.x0, rect.x1));
  const y0 = clampUnit(Math.min(rect.y0, rect.y1));
  const y1 = clampUnit(Math.max(rect.y0, rect.y1));
  if (x1 <= x0 || y1 <= y0) {
    return null;
  }
  return { x0, y0, x1, y1 };
}

export function rectFromXywh(x: number, y: number, width: number, height: number): NormalizedRect | null {
  return normalizeRect({
    x0: x,
    y0: y,
    x1: x + width,
    y1: y + height,
  });
}

export function rectWidth(rect: NormalizedRect): number {
  return Math.max(0, rect.x1 - rect.x0);
}

export function rectHeight(rect: NormalizedRect): number {
  return Math.max(0, rect.y1 - rect.y0);
}

export function rectArea(rect: NormalizedRect): number {
  return rectWidth(rect) * rectHeight(rect);
}

export function intersectionRect(a: NormalizedRect, b: NormalizedRect): NormalizedRect | null {
  const x0 = Math.max(a.x0, b.x0);
  const y0 = Math.max(a.y0, b.y0);
  const x1 = Math.min(a.x1, b.x1);
  const y1 = Math.min(a.y1, b.y1);
  if (x1 <= x0 || y1 <= y0) {
    return null;
  }
  return { x0, y0, x1, y1 };
}

/** Share of the token’s area that lies inside `rect` (0…1). */
export function tokenCoverageRatio(token: LayoutToken, rect: NormalizedRect): number {
  const tokenRect: NormalizedRect = {
    x0: token.x0,
    y0: token.y0,
    x1: token.x1,
    y1: token.y1,
  };
  const tokenArea = rectArea(tokenRect);
  if (tokenArea <= 0) {
    return 0;
  }
  const overlap = intersectionRect(tokenRect, rect);
  if (!overlap) {
    return 0;
  }
  return rectArea(overlap) / tokenArea;
}

export function tokenBelongsToRect(
  token: LayoutToken,
  rect: NormalizedRect,
  minCoverage = TOKEN_COVERAGE_THRESHOLD
): boolean {
  return tokenCoverageRatio(token, rect) >= minCoverage;
}

export function tokensInsideRect(
  tokens: readonly LayoutToken[],
  rect: NormalizedRect,
  minCoverage = TOKEN_COVERAGE_THRESHOLD
): LayoutToken[] {
  const normalized = normalizeRect(rect);
  if (!normalized) {
    return [];
  }
  return tokens.filter((token) => tokenBelongsToRect(token, normalized, minCoverage));
}

export function snapRectToTokenHull(tokens: readonly LayoutToken[]): NormalizedRect | null {
  if (tokens.length === 0) {
    return null;
  }
  let x0 = tokens[0].x0;
  let y0 = tokens[0].y0;
  let x1 = tokens[0].x1;
  let y1 = tokens[0].y1;
  for (const token of tokens) {
    x0 = Math.min(x0, token.x0);
    y0 = Math.min(y0, token.y0);
    x1 = Math.max(x1, token.x1);
    y1 = Math.max(y1, token.y1);
  }
  return normalizeRect({ x0, y0, x1, y1 });
}

export function joinedTokenText(tokens: readonly LayoutToken[]): string {
  return tokens
    .map((token) => token.text.trim())
    .filter((part) => part.length > 0)
    .join(' ');
}

export interface RemappedRegionTokens {
  tokens: LayoutToken[];
  snappedRect: NormalizedRect | null;
  previousText: string;
  nextText: string;
  textChanged: boolean;
}

/** Re-resolve a stored rectangle against a new IR token set (same ≥50% area rule). */
export function remapRegionTokens(
  previousTokens: readonly LayoutToken[],
  nextTokens: readonly LayoutToken[],
  rect: NormalizedRect,
  minCoverage = TOKEN_COVERAGE_THRESHOLD
): RemappedRegionTokens {
  const next = tokensInsideRect(nextTokens, rect, minCoverage);
  const previousText = joinedTokenText(previousTokens);
  const nextText = joinedTokenText(next);
  return {
    tokens: next,
    snappedRect: snapRectToTokenHull(next),
    previousText,
    nextText,
    textChanged: previousText !== nextText,
  };
}

export function roundGeometry(value: number, decimals = GEOMETRY_HASH_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function canonicalRegionPayload(input: {
  role: string;
  page: number;
  rect: NormalizedRect;
  blockIndexes: readonly number[];
  fieldKey?: string;
  valueOverride?: string | null;
  attributes?: Record<string, string | number | boolean | null>;
}): string {
  const blockIndexes = [...input.blockIndexes].sort((a, b) => a - b);
  const body: Record<string, unknown> = {
    role: input.role,
    page: input.page,
    x0: roundGeometry(input.rect.x0),
    y0: roundGeometry(input.rect.y0),
    x1: roundGeometry(input.rect.x1),
    y1: roundGeometry(input.rect.y1),
    blockIndexes,
  };
  if (input.fieldKey !== undefined) {
    body.fieldKey = input.fieldKey;
  }
  if (input.valueOverride !== undefined) {
    body.valueOverride = input.valueOverride;
  }
  if (input.attributes) {
    const keys = Object.keys(input.attributes).sort();
    const attrs: Record<string, string | number | boolean | null> = {};
    for (const key of keys) {
      attrs[key] = input.attributes[key] ?? null;
    }
    body.attributes = attrs;
  }
  return JSON.stringify(body);
}
