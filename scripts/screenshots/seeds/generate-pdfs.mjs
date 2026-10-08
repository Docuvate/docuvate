import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

async function writePdf(name, lines) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  let y = 800;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
    y -= 18;
  }
  fs.writeFileSync(path.join(dir, name), Buffer.from(await doc.save()));
}

await writePdf('lieferschein-nordwind-gmbh.pdf', [
  'Lieferschein Nordwind GmbH (Muster)',
  'Datum: 08.10.2026',
  'Position: Beratungsleistung Projekt Alpha',
  'Frei erfundener Screenshot-Inhalt.',
]);
await writePdf('protokoll-team-alpha-q1.pdf', [
  'Protokoll Team Alpha Q1 2026 (Muster)',
  'Teilnehmer: Erika Beispiel, Jonas Demo',
  'TOP 1: Quartalsziele erfuellt.',
  'TOP 2: Ablage vereinheitlichen.',
  'Frei erfundener Screenshot-Inhalt.',
]);
await writePdf('vertrag-beispiel-consulting.pdf', [
  'Rahmenvertrag Beispiel Consulting (Muster)',
  'Parteien: Nordwind GmbH / Beispiel Consulting',
  'Laufzeit: 12 Monate',
  'Frei erfundener Screenshot-Inhalt.',
]);
console.log('generated PDFs in', dir);
