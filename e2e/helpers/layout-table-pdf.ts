import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BANNER =
  'Synthetic layout regression document with enough words to classify as born digital.';

function pdfEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Well-formed single-page delivery note. Unique token lives in the content stream. */
export function deliveryNoteTablePdf(uniqueToken = 'static'): Buffer {
  const lines = [
    `BT /F1 9 Tf 36 760 Td (${pdfEscape(BANNER)}) Tj ET`,
    '0.5 700 m 400 700 l S',
    '0.5 680 m 400 680 l S',
    '0.5 660 m 400 660 l S',
    '0.5 640 m 400 640 l S',
    '100 700 m 100 640 l S',
    '200 700 m 200 640 l S',
    '300 700 m 300 640 l S',
    '400 700 m 400 640 l S',
    'BT /F1 10 Tf 12 688 Td (Item) Tj ET',
    'BT /F1 10 Tf 112 688 Td (Qty) Tj ET',
    'BT /F1 10 Tf 12 668 Td (Widget A) Tj ET',
    'BT /F1 10 Tf 112 668 Td (2) Tj ET',
    'BT /F1 10 Tf 12 648 Td (Widget B) Tj ET',
    'BT /F1 10 Tf 112 648 Td (1) Tj ET',
    `BT /F1 8 Tf 36 620 Td (${pdfEscape(`fixture ${uniqueToken}`)}) Tj ET`,
  ];
  const stream = `${lines.join('\n')}\n`;
  const streamLen = Buffer.byteLength(stream, 'latin1');
  const objects = [
    '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
    '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj',
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj',
    `4 0 obj<< /Length ${String(streamLen)} >>stream\n${stream}endstream\nendobj`,
    '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${obj}\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${String(objects.length + 1)}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index <= objects.length; index += 1) {
    const offset = offsets[index];
    if (offset === undefined) {
      throw new Error('pdf xref offset missing');
    }
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${String(objects.length + 1)} /Root 1 0 R >>\nstartxref\n${String(xrefStart)}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

/** Synthetic delivery-note PDF with a detectable layout table (worker fixture). */
export function deliveryNoteTablePdfPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'docuvate-e2e-table-'));
  const out = join(dir, 'delivery-note-table.pdf');
  writeFileSync(out, deliveryNoteTablePdf());
  return out;
}
