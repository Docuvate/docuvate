// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutToken } from '@docuvate/contracts';

const ANCHOR_TOKEN_LIMIT = 8;

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function normalizeAmountToken(value: string): string {
  let compact = '';
  for (const char of value) {
    if (char !== ' ' && char !== '\t') {
      compact += char;
    }
  }
  return compact.split('.').join('').replace(',', '.');
}

function looksLikeAmount(value: string): boolean {
  const compact = normalizeAmountToken(value);
  const comma = compact.lastIndexOf('.');
  if (comma < 1 || comma !== compact.length - 3) {
    return false;
  }
  for (let index = 0; index < compact.length; index += 1) {
    const char = compact[index];
    if (index === comma) {
      continue;
    }
    if (!isDigit(char)) {
      return false;
    }
  }
  return true;
}

function findAmountIndex(line: string, amount: string): number {
  const target = normalizeAmountToken(amount);
  let index = 0;
  while (index < line.length) {
    if (!isDigit(line[index])) {
      index += 1;
      continue;
    }
    let end = index;
    while (end < line.length) {
      const char = line[end];
      if (isDigit(char) || char === '.' || char === ',') {
        end += 1;
        continue;
      }
      break;
    }
    const candidate = line.slice(index, end);
    if (looksLikeAmount(candidate) && normalizeAmountToken(candidate) === target) {
      return index;
    }
    index += 1;
  }
  return -1;
}

function lineContainsValue(line: string, value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return -1;
  }
  const direct = line.indexOf(trimmed);
  if (direct >= 0) {
    return direct;
  }
  if (!looksLikeAmount(trimmed)) {
    return -1;
  }
  return findAmountIndex(line, trimmed);
}

function trimRightSeparators(value: string): string {
  let end = value.length;
  while (end > 0) {
    const char = value[end - 1];
    if (char === ' ' || char === ':' || char === '-' || char === '–' || char === '—') {
      end -= 1;
      continue;
    }
    break;
  }
  return value.slice(0, end);
}

function stripPeriodPrefix(value: string): string {
  if (!value.startsWith('/')) {
    return value.trim();
  }
  let index = 1;
  while (index < value.length && isDigit(value[index])) {
    index += 1;
  }
  if (index < value.length && value[index] >= 'A' && value[index] <= 'Z') {
    index += 1;
  }
  if (index < value.length && value[index] === ' ') {
    return value.slice(index + 1).trim();
  }
  return value.trim();
}

function stripPeriodSuffix(value: string): string {
  const lastSlash = value.lastIndexOf('/');
  if (lastSlash < 0) {
    return value.trim();
  }
  const tail = value.slice(lastSlash + 1);
  let index = 0;
  while (index < tail.length && isDigit(tail[index])) {
    index += 1;
  }
  if (index < tail.length && tail[index] >= 'A' && tail[index] <= 'Z') {
    index += 1;
  }
  if (index === tail.length) {
    return value.slice(0, lastSlash).trim();
  }
  return value.trim();
}

/** Tokens immediately left of the corrected value on its line — teaches layout, not the value. */
export function inferFieldCorrectionAnchorLabel(
  documentText: string,
  correctedValue: string
): string | null {
  const value = correctedValue.trim();
  if (!value || !documentText.trim()) {
    return null;
  }
  const lines = documentText.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    const idx = lineContainsValue(line, value);
    if (idx <= 0) {
      continue;
    }
    let left = trimRightSeparators(line.slice(0, idx));
    left = stripPeriodSuffix(left);
    left = stripPeriodPrefix(left);
    if (!left) {
      continue;
    }
    const tokens = left.split(' ').filter((part) => part.length > 0);
    const anchor = tokens.slice(-ANCHOR_TOKEN_LIMIT).join(' ');
    return anchor.length > 0 ? anchor : null;
  }
  return null;
}

/** Prefer stored region tokens to the left of the value on the same line cluster. */
export function inferFieldCorrectionAnchorFromTokens(
  tokens: readonly LayoutToken[],
  valueTokens: readonly LayoutToken[]
): string | null {
  if (valueTokens.length === 0) {
    return null;
  }
  const page = valueTokens[0].page;
  const minY = Math.min(...valueTokens.map((token) => token.y0));
  const maxY = Math.max(...valueTokens.map((token) => token.y1));
  const minX = Math.min(...valueTokens.map((token) => token.x0));
  const left = tokens
    .filter((token) => {
      if (token.page !== page) {
        return false;
      }
      const midY = (token.y0 + token.y1) / 2;
      return midY >= minY && midY <= maxY && token.x1 <= minX;
    })
    .sort((a, b) => a.x0 - b.x0);
  const labels = left.slice(-ANCHOR_TOKEN_LIMIT).map((token) => token.text.trim()).filter(Boolean);
  return labels.length > 0 ? labels.join(' ') : null;
}
