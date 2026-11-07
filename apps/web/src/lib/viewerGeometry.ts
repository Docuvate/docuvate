// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

interface AxisAlignedBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface LocalBoxSize {
  width: number;
  height: number;
}

function quarterTurnDegrees(rotationDeg: number): 0 | 90 | 180 | 270 {
  const turns = ((Math.round(rotationDeg / 90) % 4) + 4) % 4;
  if (turns === 1) {
    return 90;
  }
  if (turns === 2) {
    return 180;
  }
  if (turns === 3) {
    return 270;
  }
  return 0;
}

export function applyPageDisplayRotation(wrap: HTMLElement, rotationDeg: number): void {
  const degrees = quarterTurnDegrees(rotationDeg);
  wrap.dataset.displayRotation = String(degrees);
  wrap.style.transform = pageDisplayTransform(degrees);
  wrap.style.transformOrigin = 'center center';
}

/** CSS transform for a manual page rotation. Empty at 0° so layout stays untransformed. */
export function pageDisplayTransform(rotationDeg: number): string {
  const degrees = quarterTurnDegrees(rotationDeg);
  if (degrees === 0) {
    return '';
  }
  return `rotate(${String(degrees)}deg)`;
}

/**
 * Width the page occupies in the scrollport after a clockwise quarter turn.
 * 90° and 270° swap the unrotated viewport axes. PDF.js already includes
 * native /Rotate in the viewport size passed here.
 */
export function visualWidthAfterQuarterTurn(
  viewportWidth: number,
  viewportHeight: number,
  rotationDeg: number
): number {
  const turns = ((Math.round(rotationDeg / 90) % 4) + 4) % 4;
  return turns % 2 === 1 ? viewportHeight : viewportWidth;
}

function clampUnit(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

/**
 * Map a viewport point into an element's local box when that element (or an
 * ancestor that rotates it around its own center) has a clockwise CSS rotation.
 * At 0° this is `(client - bounds origin) / bounds size`, matching hit testing
 * on an unrotated page. getBoundingClientRect is the axis-aligned box after
 * rotation and is not the local coordinate system.
 */
export function clientPointToLocalRatio(
  clientX: number,
  clientY: number,
  rotatedBounds: AxisAlignedBox,
  local: LocalBoxSize,
  rotationDeg: number
): { x: number; y: number } {
  const turns = ((Math.round(rotationDeg / 90) % 4) + 4) % 4;
  if (turns === 0) {
    const width = rotatedBounds.width > 0 ? rotatedBounds.width : 1;
    const height = rotatedBounds.height > 0 ? rotatedBounds.height : 1;
    return {
      x: clampUnit((clientX - rotatedBounds.left) / width),
      y: clampUnit((clientY - rotatedBounds.top) / height),
    };
  }
  const width = local.width > 0 ? local.width : 1;
  const height = local.height > 0 ? local.height : 1;
  const centerX = rotatedBounds.left + rotatedBounds.width / 2;
  const centerY = rotatedBounds.top + rotatedBounds.height / 2;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const theta = (turns * Math.PI) / 2;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const localDx = dx * cos + dy * sin;
  const localDy = -dx * sin + dy * cos;
  return {
    x: clampUnit((width / 2 + localDx) / width),
    y: clampUnit((height / 2 + localDy) / height),
  };
}

export function clientRectToLocalRatio(
  client: AxisAlignedBox,
  rotatedBounds: AxisAlignedBox,
  local: LocalBoxSize,
  rotationDeg: number
): { x0: number; y0: number; x1: number; y1: number } {
  const corners: readonly (readonly [number, number])[] = [
    [client.left, client.top],
    [client.left + client.width, client.top],
    [client.left + client.width, client.top + client.height],
    [client.left, client.top + client.height],
  ];
  let x0 = 1;
  let y0 = 1;
  let x1 = 0;
  let y1 = 0;
  for (const [x, y] of corners) {
    const point = clientPointToLocalRatio(x, y, rotatedBounds, local, rotationDeg);
    x0 = Math.min(x0, point.x);
    y0 = Math.min(y0, point.y);
    x1 = Math.max(x1, point.x);
    y1 = Math.max(y1, point.y);
  }
  return { x0, y0, x1, y1 };
}

/** Index of the wrap for `page`, or null. Never falls back to the first page. */
export function indexOfPageWrap(pageAttributes: readonly (string | null)[], page: number): number | null {
  const wanted = String(page);
  const index = pageAttributes.findIndex((value) => value === wanted);
  return index >= 0 ? index : null;
}

export function findPdfPageWrap(page: number): HTMLElement | null {
  const wraps = [...document.querySelectorAll('.pdf-page-wrap')].filter(
    (node): node is HTMLElement => node instanceof HTMLElement
  );
  const index = indexOfPageWrap(
    wraps.map((wrap) => wrap.dataset.page ?? null),
    page
  );
  if (index == null) {
    return null;
  }
  return wraps[index] ?? null;
}

export function readDatasetRotation(raw: string | undefined): number {
  if (raw == null || raw === '') {
    return 0;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}
