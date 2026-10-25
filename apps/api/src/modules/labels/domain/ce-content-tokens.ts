// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const TOKEN_RE = /^[\p{L}]{3,}$/u;

export function contentTokensFromText(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\s+/)) {
    const token = raw.trim();
    if (token.length === 0) {
      continue;
    }
    if (!TOKEN_RE.test(token)) {
      continue;
    }
    out.push(token.toLowerCase());
  }
  return out;
}
