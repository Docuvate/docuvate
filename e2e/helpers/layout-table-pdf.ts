// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PDFDocument, StandardFonts } from 'pdf-lib';

const BANNER =
  'Synthetic layout regression document with enough words to classify as born digital.';

/** Well-formed single-page delivery note. Unique token lives in the content stream. */
export async function deliveryNoteTablePdf(uniqueToken = 'static'): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(BANNER, { x: 36, y: 760, size: 9, font });
  const horizontals = [700, 680, 660, 640];
  for (const y of horizontals) {
    page.drawLine({
      start: { x: 0.5, y },
      end: { x: 400, y },
      thickness: 0.5,
    });
  }
  const verticals = [100, 200, 300, 400];
  for (const x of verticals) {
    page.drawLine({
      start: { x, y: 640 },
      end: { x, y: 700 },
      thickness: 0.5,
    });
  }
  page.drawText('Item', { x: 12, y: 688, size: 10, font });
  page.drawText('Qty', { x: 112, y: 688, size: 10, font });
  page.drawText('Widget A', { x: 12, y: 668, size: 10, font });
  page.drawText('2', { x: 112, y: 668, size: 10, font });
  page.drawText('Widget B', { x: 12, y: 648, size: 10, font });
  page.drawText('1', { x: 112, y: 648, size: 10, font });
  page.drawText(`fixture ${uniqueToken}`, { x: 36, y: 620, size: 8, font });
  return Buffer.from(await pdf.save());
}

/** Synthetic delivery-note PDF with a detectable layout table (worker fixture). */
export async function deliveryNoteTablePdfPath(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'docuvate-e2e-table-'));
  const out = join(dir, 'delivery-note-table.pdf');
  writeFileSync(out, await deliveryNoteTablePdf());
  return out;
}
