// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const EU_AMOUNT = /[0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}/;

function normalizeAmountToken(value: string): string {
  return value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
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
  const amount = EU_AMOUNT.exec(trimmed)?.[0];
  if (!amount) {
    return -1;
  }
  const target = normalizeAmountToken(amount);
  const match = EU_AMOUNT.exec(line);
  if (!match) {
    return -1;
  }
  if (normalizeAmountToken(match[0]) === target) {
    return match.index ?? -1;
  }
  return -1;
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
  for (const rawLine of documentText.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const idx = lineContainsValue(line, value);
    if (idx <= 0) {
      continue;
    }
    let left = line.slice(0, idx).trim().replace(/[\s:–—-]+$/u, '');
    left = left.replace(/\/\d+[A-Z]?\s*$/u, '').trim();
    left = left.replace(/^\/\d+[A-Z]?\s+/u, '').trim();
    if (!left) {
      continue;
    }
    const tokens = left.split(/\s+/).filter(Boolean);
    const anchor = tokens.slice(-8).join(' ');
    return anchor.length > 0 ? anchor : null;
  }
  return null;
}
