import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../e2e/fixtures');

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const page = doc.addPage([595, 842]);
for (const [i, line] of [
  'E2E_SYNTHETIC_FIXTURE_PHRASE_Q1',
  'Alex Testmann — fixture.docuvate.test',
  'Compose smoke upload (no production data).',
].entries()) {
  page.drawText(line, { x: 50, y: 800 - i * 22, size: 14, font, color: rgb(0.1, 0.1, 0.1) });
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'synthetic-upload.pdf'), Buffer.from(await doc.save()));
console.log('Wrote e2e/fixtures/synthetic-upload.pdf');
