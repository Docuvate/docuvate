// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const HEX_DIGITS = '0123456789abcdefABCDEF';
const DASH_AT = new Set([8, 13, 18, 23]);

export function isUuid(value: string): boolean {
  if (value.length !== 36) {
    return false;
  }
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (DASH_AT.has(index)) {
      if (char !== '-') {
        return false;
      }
      continue;
    }
    if (!HEX_DIGITS.includes(char)) {
      return false;
    }
  }
  return true;
}
