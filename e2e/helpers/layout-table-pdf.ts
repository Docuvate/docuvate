// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PDFDocument, StandardFonts } from 'pdf-lib';

function syntheticUploadPath(): string {
  const fromHelper = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/synthetic-upload.pdf');
  if (existsSync(fromHelper)) {
    return fromHelper;
  }
  return join(process.cwd(), 'fixtures/synthetic-upload.pdf');
}

/**
 * Stamp the known-good smoke PDF with Widget A + a unique token.
 * Hand-rolled PDFs are a permanent worker 422; this file already extracts in CI.
 */
export async function deliveryNoteTablePdf(uniqueToken = 'static'): Promise<Buffer> {
  const pdf = await PDFDocument.load(readFileSync(syntheticUploadPath()));
  const page = pdf.getPage(0);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();
  page.drawText(`Item  Qty`, { x: 36, y: height - 72, size: 11, font });
  page.drawText(`Widget A  2`, { x: 36, y: height - 90, size: 12, font });
  page.drawText(`Widget B  1`, { x: 36, y: height - 108, size: 12, font });
  page.drawText(`fixture ${uniqueToken}`, { x: 36, y: height - 128, size: 9, font });
  return Buffer.from(await pdf.save());
}

/** Synthetic delivery-note PDF with a detectable layout table (worker fixture). */
export async function deliveryNoteTablePdfPath(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'docuvate-e2e-table-'));
  const out = join(dir, 'delivery-note-table.pdf');
  writeFileSync(out, await deliveryNoteTablePdf());
  return out;
}
