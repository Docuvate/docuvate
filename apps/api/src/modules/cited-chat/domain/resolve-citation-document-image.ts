// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentExtractionImageDto, NormalizedBBox } from '@docuvate/contracts';

function intersectionArea(a: NormalizedBBox, b: NormalizedBBox): number {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.width, b.x + b.width);
  const y1 = Math.min(a.y + a.height, b.y + b.height);
  if (x1 <= x0 || y1 <= y0) {
    return 0;
  }
  return (x1 - x0) * (y1 - y0);
}

/** Pick one evidenced image when citation bbox overlaps an extracted image on the same page. */
export function resolveCitationDocumentImage(
  page: number | null,
  bbox: NormalizedBBox | null,
  images: DocumentExtractionImageDto[]
): DocumentExtractionImageDto | null {
  if (!bbox || page == null) {
    return null;
  }
  const pageImages = images.filter((image) => image.page === page);
  let best: DocumentExtractionImageDto | null = null;
  let bestScore = 0;
  for (const image of pageImages) {
    const imageBox: NormalizedBBox = {
      x: image.x,
      y: image.y,
      width: image.width,
      height: image.height,
    };
    const inter = intersectionArea(bbox, imageBox);
    const citationArea = bbox.width * bbox.height;
    if (citationArea <= 0) {
      continue;
    }
    const score = inter / citationArea;
    if (score > bestScore && score >= 0.15) {
      bestScore = score;
      best = image;
    }
  }
  return best;
}
