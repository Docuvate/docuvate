// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
// Synthetic 3-page PDF for the text-view E2E (no production data).
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../e2e/fixtures');

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
for (const pageNumber of [1, 2, 3]) {
  const page = doc.addPage([595, 842]);
  for (const [i, line] of [
    `E2E_MULTIPAGE_TEXT_PAGE_${String(pageNumber)}`,
    `Alex Testmann fixture page ${String(pageNumber)} of 3`,
    'Synthetic multi-page text view (no production data).',
  ].entries()) {
    page.drawText(line, { x: 50, y: 800 - i * 22, size: 14, font, color: rgb(0.1, 0.1, 0.1) });
  }
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'synthetic-multipage.pdf'), Buffer.from(await doc.save()));
console.log('Wrote e2e/fixtures/synthetic-multipage.pdf');
