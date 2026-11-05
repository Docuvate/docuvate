// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/**
 * Axis-aligned box in viewer page space (PDF.js viewport / pdfplumber after /Rotate),
 * origin top-left, range 0…1. Glyph `rotationDeg` on tokens is separate from page /Rotate.
 */
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
  /** Glyph CTM rotation in degrees when the span is not upright; omit when upright. */
  rotationDeg?: number;
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

export function rectFromXywh(
  x: number,
  y: number,
  width: number,
  height: number
): NormalizedRect | null {
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

function tokenRectOf(token: LayoutToken): NormalizedRect {
  return {
    x0: token.x0,
    y0: token.y0,
    x1: token.x1,
    y1: token.y1,
  };
}

/** Share of the token’s area that lies inside `rect` (0…1). */
export function tokenCoverageRatio(token: LayoutToken, rect: NormalizedRect): number {
  const tokenRect = tokenRectOf(token);
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

function tokenCenterInsideRect(token: LayoutToken, rect: NormalizedRect): boolean {
  const cx = (token.x0 + token.x1) / 2;
  const cy = (token.y0 + token.y1) / 2;
  return cx >= rect.x0 && cx <= rect.x1 && cy >= rect.y0 && cy <= rect.y1;
}

/**
 * Quarter-turn page /Rotate: map a normalized point from the PDF.js viewer
 * (rotation applied) into unrotated MediaBox-normalized space.
 * Identity when `pageRotationDeg` is 0.
 */
export function viewerPointToUnrotatedPage(
  x: number,
  y: number,
  pageRotationDeg: number
): { x: number; y: number } {
  const turns = ((Math.round(pageRotationDeg / 90) % 4) + 4) % 4;
  if (turns === 0) {
    return { x: clampUnit(x), y: clampUnit(y) };
  }
  if (turns === 1) {
    // 90° clockwise viewer: viewer(x,y) ← unrotated(y, 1-x)  ⇒ inverse
    return { x: clampUnit(1 - y), y: clampUnit(x) };
  }
  if (turns === 2) {
    return { x: clampUnit(1 - x), y: clampUnit(1 - y) };
  }
  // 270° clockwise / 90° counter-clockwise
  return { x: clampUnit(y), y: clampUnit(1 - x) };
}

/** Map a viewer-space rectangle through {@link viewerPointToUnrotatedPage}. */
export function viewerRectToUnrotatedPage(
  rect: NormalizedRect,
  pageRotationDeg: number
): NormalizedRect | null {
  const a = viewerPointToUnrotatedPage(rect.x0, rect.y0, pageRotationDeg);
  const b = viewerPointToUnrotatedPage(rect.x1, rect.y1, pageRotationDeg);
  return normalizeRect({ x0: a.x, y0: a.y, x1: b.x, y1: b.y });
}

/**
 * When IR already matches the PDF.js viewport (pdfplumber applies /Rotate), pass 0.
 * When tokens were stored against the unrotated MediaBox, pass the page /Rotate so
 * the drawn viewer rectangle is remapped before hit-testing.
 */
export function selectionRectForTokenSpace(
  viewerRect: NormalizedRect,
  pageRotationDeg: number,
  tokensInUnrotatedMediaBox: boolean
): NormalizedRect | null {
  const normalized = normalizeRect(viewerRect);
  if (!normalized) {
    return null;
  }
  if (!tokensInUnrotatedMediaBox || pageRotationDeg === 0) {
    return normalized;
  }
  return viewerRectToUnrotatedPage(normalized, pageRotationDeg);
}

export function tokenBelongsToRect(
  token: LayoutToken,
  rect: NormalizedRect,
  minCoverage = TOKEN_COVERAGE_THRESHOLD
): boolean {
  if (tokenCoverageRatio(token, rect) >= minCoverage) {
    return true;
  }
  // Thin selections over tall AABBs of rotated glyphs rarely reach 50% coverage;
  // accepting a token whose center lies inside the drawn rectangle keeps word-level
  // hits working without swallowing neighbouring runs (those are separate tokens).
  if (tokenCenterInsideRect(token, rect) && intersectionRect(tokenRectOf(token), rect)) {
    return true;
  }
  return false;
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

export function normalizeSelectionText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function selectionWords(value: string): string[] {
  return normalizeSelectionText(value)
    .split(/[^a-z0-9äöüäß]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);
}

/**
 * Resolve IR tokens from a DOM text selection string when geometry misses
 * (common on /Rotate pages where PDF.js textLayer boxes ≠ pdfplumber boxes).
 * Matches on alphanumeric words only (exact), so OCR fragments like
 * "E2E_SYNTHETI" do not hitch a ride on "E2E_SYNTHETIC_FIXTURE…".
 */
export function tokensMatchingSelectedText(
  tokens: readonly LayoutToken[],
  selectedText: string,
  nearRect?: NormalizedRect | null
): LayoutToken[] {
  const words = new Set(selectionWords(selectedText));
  if (words.size === 0) {
    return [];
  }
  const matched = tokens.filter((token) => {
    const pieceWords = selectionWords(token.text);
    if (pieceWords.length === 0) {
      return false;
    }
    return pieceWords.every((word) => words.has(word));
  });
  if (matched.length <= 1 || nearRect == null) {
    return matched;
  }
  const cx = (nearRect.x0 + nearRect.x1) / 2;
  const cy = (nearRect.y0 + nearRect.y1) / 2;
  return [...matched].sort((a, b) => {
    const da =
      ((a.x0 + a.x1) / 2 - cx) ** 2 + ((a.y0 + a.y1) / 2 - cy) ** 2;
    const db =
      ((b.x0 + b.x1) / 2 - cx) ** 2 + ((b.y0 + b.y1) / 2 - cy) ** 2;
    return da - db;
  });
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

/** Re-resolve a stored rectangle against a new IR token set (same belonging rules). */
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
