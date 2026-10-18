// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import type { ExtractionImageIngestDto } from '@docuvate/contracts';

import type { ObjectStorage } from '../../../shared/domain/ports.js';

export interface PersistedExtractionImageRow {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'embedded' | 'figure';
  caption: string | null;
  thumbnailStorageKey: string;
}

export async function persistExtractionImagesFromWorker(
  storage: ObjectStorage,
  userId: string,
  documentId: string,
  images: ExtractionImageIngestDto[]
): Promise<PersistedExtractionImageRow[]> {
  const out: PersistedExtractionImageRow[] = [];
  for (const image of images) {
    const id = randomUUID();
    const key = `users/${userId}/${documentId}/extraction-images/${id}.png`;
    const buffer = Buffer.from(image.thumbnailPngBase64, 'base64');
    if (buffer.length === 0) {
      continue;
    }
    await storage.putObject(key, buffer, 'image/png');
    out.push({
      id,
      page: image.page,
      x: image.x,
      y: image.y,
      width: image.width,
      height: image.height,
      kind: image.kind,
      caption: image.caption ?? null,
      thumbnailStorageKey: key,
    });
  }
  return out;
}
