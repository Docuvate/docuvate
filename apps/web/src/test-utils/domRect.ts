// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export function mockDomRect(parts: {
  top: number;
  bottom: number;
  left: number;
  width: number;
}): DOMRect {
  const height = parts.bottom - parts.top;
  return {
    top: parts.top,
    bottom: parts.bottom,
    left: parts.left,
    right: parts.left + parts.width,
    width: parts.width,
    height,
    x: parts.left,
    y: parts.top,
    toJSON: () => ({}),
  };
}
