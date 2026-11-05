// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { degrees, PDFDocument } from 'pdf-lib';

export type PageRotationDeg = 90 | 180;

/**
 * Known-good smoke PDF with a page /Rotate set. Do not rewrite the content
 * stream — append a unique trailer so content-hash stays unique per upload.
 */
export async function rotatedSyntheticPdf(
  rotationDeg: PageRotationDeg,
  uniqueToken = ''
): Promise<Buffer> {
  const basePath = join(process.cwd(), 'fixtures/synthetic-upload.pdf');
  const base = readFileSync(basePath);
  const pdf = await PDFDocument.load(base, { ignoreEncryption: true });
  const pages = pdf.getPages();
  if (pages.length === 0) {
    throw new Error('synthetic-upload.pdf has no pages');
  }
  const first = pages[0];
  if (first == null) {
    throw new Error('synthetic-upload.pdf missing page 0');
  }
  first.setRotation(degrees(rotationDeg));
  const bytes = await pdf.save({ useObjectStreams: false });
  const token =
    uniqueToken.trim().length > 0
      ? uniqueToken.trim()
      : randomUUID().replace(/-/g, '').slice(0, 12);
  return Buffer.concat([
    Buffer.from(bytes),
    Buffer.from(`\n%%ROTATION_FIXTURE=${String(rotationDeg)}:${token}\n`, 'utf8'),
  ]);
}
