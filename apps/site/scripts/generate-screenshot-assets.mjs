import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { SCREENSHOT_INVOICE, SCREENSHOT_OTHER_DOCS } from './screenshot-seed-data.mjs';

const siteScripts = dirname(fileURLToPath(import.meta.url));
const demoDir = join(siteScripts, '../../web/public/demo');
mkdirSync(demoDir, { recursive: true });

spawnSync('node', [join(siteScripts, '../../web/scripts/generate-demo-preview.mjs')], {
  stdio: 'inherit',
});

const invoicePdf = join(demoDir, SCREENSHOT_INVOICE.filename);
if (!existsSync(invoicePdf)) {
  throw new Error(`Missing invoice PDF at ${invoicePdf}`);
}

const preview = join(demoDir, 'invoice-preview.png');

const stubPdfBodies = {
  'mietvertrag-beispiel.pdf': 'Mietvertrag Wohnung Nord\nMustermieter GmbH\nLaufzeit 24 Monate',
  'kontoauszug-januar.pdf': 'Kontoauszug Januar 2024\nNordbeispiel Bank AG\nSaldo 4.820,50 EUR',
  'versicherungsbescheinigung.pdf': 'Versicherungsbescheinigung\nBeispiel Versicherung AG\nGültig bis 31.12.2025',
  'gehaltsabrechnung-demo.pdf': 'Gehaltsabrechnung November\nNordbeispiel Arbeitgeber GmbH\nNetto 2.450,00 EUR',
};

function minimalPdf(textLine) {
  const safe = textLine.replace(/[()\\]/g, ' ');
  return `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R>>endobj
4 0 obj<</Length ${44 + safe.length}>>stream
BT /F1 12 Tf 72 720 Td (${safe.slice(0, 80)}) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000224 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
320
%%EOF`;
}

for (const doc of SCREENSHOT_OTHER_DOCS) {
  const target = join(demoDir, doc.filename);
  if (doc.filename.endsWith('.jpg')) {
    copyFileSync(preview, target);
  } else if (doc.filename.endsWith('.pdf')) {
    const body = stubPdfBodies[doc.filename] ?? 'Beispiel Dokument';
    writeFileSync(target, minimalPdf(body.split('\n')[0] ?? body));
  }
}

const stagingDir = join(demoDir, 'upload-staging');
mkdirSync(stagingDir, { recursive: true });

/** Files only for library upload demo (must differ from seed documents to avoid duplicate review). */
const uploadStaging = [
  { filename: 'lieferschein-nord-2042.pdf', line: 'Lieferschein 2042-A · Nordbeispiel Logistik' },
  { filename: 'protokoll-wartung-heizung.pdf', line: 'Wartungsprotokoll Heizung · Objekt Nord 12' },
  { filename: 'angebot-buero-reinigung.pdf', line: 'Angebot Büroreinigung · Musterfacility GmbH' },
];

for (const file of uploadStaging) {
  writeFileSync(join(stagingDir, file.filename), minimalPdf(file.line));
}

console.log('Screenshot assets ready in', demoDir);
